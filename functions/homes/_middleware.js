// Live-renders /homes/<id> on every request instead of serving the frozen static
// snapshot captured at conversion time — see docs (Spradley conversion notes) for why:
// the source app fetches Spradley's own Rent Manager feed per request with a 5-minute
// in-memory cache (lib/listings.ts), so a listing's price/availability/description can
// change, or a brand-new listing can appear, without anyone needing to rebuild or
// re-import this site. Pages Functions middleware runs before static asset serving for
// its scope (this file, scoped to /homes/* by its directory), so it can intercept a
// listing detail request that would otherwise just hit the static snapshot file.
//
// Only /homes/<digits> is intercepted — the /homes search/filter page itself is left as
// the existing static snapshot (a known, accepted trade-off: that page is a stateful
// React client component — filters, a 3-way comparison tool, a map view — reproducing
// its interactivity without React was out of scope for this pass; see the PR
// description). A request for /homes itself, or any other /homes/* path, falls through
// to normal static serving via next().
import { getDetail, getListings } from '../_lib/listings.js';
import { renderHomeDetail, renderHomeMeta, renderHomeNotFound, renderHomeError } from '../_lib/render-home-detail.js';
import { esc } from '../_lib/esc.js';

const HOME_ID_PATH = /^\/homes\/(\d+)\/?$/;
// The shell has TWO <main id="main"> elements in its raw text: a Suspense loading
// fallback (class="rental-loading-page") shipped first, then the real content
// (class="rental-detail wrap") shipped later as an out-of-band streaming chunk — with
// the page's <title>/meta data island (also out-of-band) sitting textually BETWEEN
// them. A greedy `<main id="main">...</main>` match spans from the fallback's opening
// tag to the real content's closing tag, so replacing it also destroys the just-applied
// title/meta rewrite. Anchor on the real content's distinguishing class and match
// lazily so only that block is touched.
const MAIN_CONTENT_PATTERN = /<main id="main" class="rental-detail wrap">[\s\S]*?<\/main>/;
// Cloudflare Pages' default "clean URLs" behavior 308-redirects a request for a bare
// *.html path to its extensionless form — env.ASSETS.fetch() respects that same
// redirect, so fetching a name like home-shell.html directly returned a 308 (not `ok`)
// instead of the file, and fetchShell silently fell back to next() (serving the stale
// crawled snapshot this middleware exists to replace) with no visible error. Naming
// this file index.html sidesteps it — same reason the Blue Crown conversion's
// properties/_middleware.js fetches its shell as .../index.html rather than a bare name.
const SHELL_PATH = '/_shell/index.html';

async function fetchShell(env, base) {
  const res = await env.ASSETS.fetch(new URL(SHELL_PATH, base));
  return res.ok ? res.text() : null;
}

// The shell's <head> has no plain <title>/<meta description>/<link canonical> — like
// the real <main> content, the app delivers page metadata via the same streaming
// reveal mechanism (generateMetadata()'s output arrives as a hidden, out-of-band
// <title>/<meta>/<link> data island in the body, not inline in the initial head).
// replaceOrInsert's regexes match that out-of-band copy (wherever it landed) and
// overwrite it in place; the insert-before-</head> fallback only fires if a shell is
// ever reused where that out-of-band chunk is missing entirely.
function replaceOrInsert(html, pattern, tag) {
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace('</head>', `${tag}</head>`);
}
function withMeta(shell, meta) {
  let html = shell;
  html = replaceOrInsert(html, /<title>.*?<\/title>/s, `<title>${esc(meta.title)}</title>`);
  html = replaceOrInsert(html, /<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(meta.description)}">`);
  html = replaceOrInsert(html, /<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${esc(meta.canonical)}">`);
  return html;
}

export async function onRequest({ request, next, env }) {
  const url = new URL(request.url);
  const match = HOME_ID_PATH.exec(url.pathname);
  if (!match || !['GET', 'HEAD'].includes(request.method)) return next();
  const id = match[1];

  const shell = await fetchShell(env, url);
  if (!shell) return next(); // no shell available — fall through to whatever static serving finds

  const headers = { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' };

  let detail;
  try {
    detail = await getDetail(id);
  } catch {
    const page = withMeta(shell, renderHomeMeta(null, id)).replace(MAIN_CONTENT_PATTERN, renderHomeError(id));
    return new Response(page, { headers, status: 503 });
  }

  if (!detail) {
    const page = withMeta(shell, renderHomeMeta(null, id)).replace(MAIN_CONTENT_PATTERN, renderHomeNotFound());
    return new Response(page, { headers, status: 404 });
  }

  const related = (await getListings().catch(() => []))
    .filter(v => v.id !== id)
    .slice(0, 3);

  const meta = renderHomeMeta(detail, id);
  const page = withMeta(shell, meta).replace(MAIN_CONTENT_PATTERN, renderHomeDetail(detail, related));

  if (request.method === 'HEAD') return new Response(null, { headers });
  return new Response(page, { headers });
}
