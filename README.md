# Aptly static export — Cloudflare Pages alternative deploy

## Why this exists

This app's build output (`dist/server/index.js` from `vinext`) targets a real Cloudflare
Worker, not a static export — the same beta site-builder framework behind several other
AI-generated property-management sites we've since converted. We tried deploying that
Worker bundle directly as a Cloudflare **Pages Advanced Mode** (`_worker.js`) project,
since that would need zero hand-translation and stay perfectly in sync with the real app
automatically. It doesn't work: Pages' `_worker.js` bundler fails to resolve `vinext`'s
internal `ssr/index.js → ../index.js` cross-reference when staging files into its own
temp build directory (`Could not resolve "../index.js"` from
`.wrangler/tmp/pages-*/ssr/index.js`). That's a genuine tooling incompatibility between
Pages' bundler and this beta framework's build output shape — not something fixable from
this repo.

This directory is the fallback: a hand-built, statically-hostable version of the site
that a plain Cloudflare Pages project (static assets + Pages Functions) can serve
directly, no Workers/Next.js runtime required.

## What's live vs. static

| Path | Behavior |
| --- | --- |
| `/homes/<id>` (listing detail) | **Live-rendered on every request.** `functions/homes/_middleware.js` fetches the listing straight from Spradley's Rent Manager feed (same 5-minute in-memory cache the real app uses, `functions/_lib/listings.js`) and rebuilds the page server-side. Price, availability, description, and new/removed listings are always current — no rebuild, no re-crawl, ever. |
| `/api/*` | Live. Ported 1:1 from the app's own route handlers (`functions/api/**`) — owner-lead form submission, listing/schools JSON, etc. |
| Everything else (`/`, `/homes` search page, `/areas/*`, `/owners/*`, `/company`, `/contact`, …) | **Static HTML snapshots**, crawled at conversion time. |

### Known limitation: `/homes`

The `/homes` search/filter page itself (not an individual listing) is a stateful React
client component — filters, a 3-way comparison tool, a map view. Reproducing that
interactivity without React was out of scope for this pass, so it stays a static
snapshot and needs a periodic re-crawl (`tools/crawl-static-pages.mjs`) to stay
reasonably current. This is the same accepted trade-off already shipped in Blue Crown's
conversion. Individual listing pages linked *from* `/homes` are always live and correct
even when the search page's own listing cards are stale.

## Directory contents

```
aptly-static-export/
├── index.html, homes/, areas/, owners/, company/, contact/, ...   ← static HTML snapshot
├── _next/                                                          ← built JS/CSS assets
├── _shell/index.html                                               ← page chrome reused by the live-render middleware (see below)
├── _headers                                                        ← Cloudflare Pages cache rules
├── images/, videos/                ← committed directly (see note below — do NOT gitignore these)
├── functions/
│   ├── homes/_middleware.js        ← live-renders /homes/<id>
│   ├── api/                        ← ported API route handlers
│   └── _lib/                       ← listings/schools/communities fetch logic, ported from lib/
└── tools/
    ├── crawl-static-pages.mjs      ← regenerate the static snapshot (everything except /homes/<id>)
    ├── refresh-shell.mjs           ← regenerate _shell/index.html (rare — see the script's own comment)
    └── resync-public-assets.mjs    ← re-copy ../public/images + ../public/videos in after they change (optional, manual — see below)
```

`images/` and `videos/` **are committed directly in this directory**, duplicating the
same files tracked at `../public/images` and `../public/videos`. This is deliberate, not
an oversight: this directory is meant to be importable as a pure static mirror (no build
step) via Aptly's own site-import tooling, which mirrors exactly what's committed under a
`sourceSubdir` with no build command and no access to anything outside that subdirectory
— an earlier version of this README described a build-time copy step instead
(`copy-public-assets.mjs`, since removed) to avoid the ~76MB of duplication, but that
approach silently produced a site with every image and video broken when actually
imported this way, since there was no build phase to run the copy and no sibling
`../public` once the subdirectory was mirrored on its own. If `public/images` or
`public/videos` change in the real app, re-run `tools/resync-public-assets.mjs` from
inside this directory and commit the result — don't reintroduce a build-time copy step
for these files.

## How `functions/homes/_middleware.js` works

1. Fetches `_shell/index.html` (the page chrome from a real crawled listing page) via
   `env.ASSETS.fetch()`. **This filename matters**: Cloudflare Pages' "clean URLs"
   redirects a bare `*.html` request to its extensionless form, and `env.ASSETS.fetch()`
   follows that same redirect — naming it anything other than `index.html` (e.g. the
   original `home-shell.html`) makes the fetch return a 308 instead of the file, and
   the middleware silently falls through to a stale static page with no visible error.
2. Rewrites `<title>`/`<meta name="description">`/`<link rel="canonical">` and the
   `<main id="main" class="rental-detail wrap">...</main>` block with fresh content from
   the live feed (`functions/_lib/render-home-detail.js`, a hand-written non-streaming
   template mirroring the real `app/homes/[id]/page.tsx` JSX).
3. **Gotcha already hit once, worth knowing if you touch this file**: the shell's raw
   HTML actually contains *two* `<main id="main">` elements — a Suspense loading
   fallback (`class="rental-loading-page"`) shipped first, and the real content
   (`class="rental-detail wrap"`) shipped later as an out-of-band streaming chunk, with
   the page's out-of-band `<title>`/meta data island sitting textually *between* them.
   A naive greedy `<main id="main">...</main>` match spans both and silently destroys
   the just-inserted title/meta along with the loading fallback. The regex here
   (`MAIN_CONTENT_PATTERN`) is anchored on the real content's distinguishing class and
   matches lazily specifically to avoid that. If you ever regenerate the shell and this
   starts silently dropping title/meta again, check for exactly this.
4. The rewritten `<title>`/meta tags land in the *body* (wherever the out-of-band chunk
   was), not `<head>` — same as the real app's own SSR output. Verified this is fine for
   the browser tab title (`document.title` doesn't require the element to be in
   `<head>`) and for any crawler that executes JS. It's a known characteristic
   inherited from the source app's own rendering, not a regression introduced here.

## Deploying (Cloudflare Pages project settings)

- **Root directory**: `aptly-static-export`
- **Build command**: none — everything needed is already committed, served as pure
  static assets + Pages Functions.
- **Build output directory**: `aptly-static-export` (or `.` if the root directory above
  already scopes the build to this folder — check whichever convention the rest of
  Aptly's Pages projects use)
- **Environment variables** (used by `functions/api/**` and the live-render path):
  - `APTLY_API_TOKEN` — required. Aptly board API token used by `functions/api/owner-lead.js` to create the lead card.
  - `APTLY_OWNER_LEADS_BOARD_ID` — optional, falls back to the board ID hardcoded as `DEFAULT_BOARD` in `owner-lead.js`.
  - `GREATSCHOOLS_API_KEY` — optional. Without it, the nearby-schools widgets on listing/area pages degrade to "School information is currently unavailable" (`functions/api/listings/[id]/schools.js`, `functions/api/areas/[slug]/schools.js`) rather than erroring.

## Keeping the static snapshot current

Run `tools/crawl-static-pages.mjs` against a locally running copy of the real app after
any content change to a static page, an area page, or an owner calculator, and commit
the result. `/homes/<id>` never needs this — it's always live. `/homes` (the search page)
should also get a periodic re-crawl even without a content change, per the known
limitation above.
