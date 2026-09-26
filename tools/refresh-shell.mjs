// Refreshes ../_shell/index.html — the raw page chrome (header/nav/footer, CSS, JS
// asset links) that functions/homes/_middleware.js reuses for every live-rendered
// /homes/<id> request, stripping and regenerating only the <title>/meta and the
// <main id="main" class="rental-detail wrap"> block per request.
//
// You almost never need this. It only needs regenerating if the app's shared page
// chrome changes (nav links, global CSS/JS bundle hashes, layout markup around <main>)
// — NOT when listing data changes, since listing data is fetched live on every request
// regardless of what's in the shell. If you do run it, re-verify functions/_lib/
// render-home-detail.js's <main id="main" class="rental-detail wrap"> output still
// matches the real app's structure, and re-check for the two-<main> streaming quirk
// documented in _middleware.js before assuming a plain crawl is safe to drop in as-is.
//
// Usage: run the real app locally, then pick any real, in-stock listing id:
//   BASE=http://127.0.0.1:3000 node refresh-shell.mjs 3164
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BASE || 'http://127.0.0.1:3000';
const id = process.argv[2];

if (!id) {
  console.error('Usage: BASE=http://127.0.0.1:3000 node refresh-shell.mjs <listing-id>');
  process.exit(1);
}

const res = await fetch(`${BASE}/homes/${id}`);
if (!res.ok) {
  console.error(`FAILED ${res.status} fetching /homes/${id}`);
  process.exit(1);
}
const html = await res.text();
const outDir = path.join(here, '..', '_shell');
await mkdir(outDir, { recursive: true });
await writeFile(path.join(outDir, 'index.html'), html);
console.log(`Wrote ${path.join(outDir, 'index.html')} (${html.length} bytes) from /homes/${id}`);
