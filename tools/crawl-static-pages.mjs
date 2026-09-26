// Regenerates the static HTML snapshot in ../ (everything EXCEPT /homes/<id>, which is
// always live-rendered by functions/homes/_middleware.js and never needs a rebuild).
// Run this after any content change to a static page, an area page, or an owner
// calculator — and periodically for /homes itself, since that search/filter page is
// still a point-in-time snapshot (see ../README.md, "Known limitation: /homes").
//
// Usage: run the real app locally (npm run dev, or `wrangler pages dev` against a real
// build), then:
//   BASE=http://127.0.0.1:3000 node crawl-static-pages.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, '..');
const BASE = process.env.BASE || 'http://127.0.0.1:3000';

const communities = [
  'temple', 'belton', 'salado', 'killeen', 'harker-heights', 'troy',
  'little-river-academy', 'morgans-point-resort'
];
const calculators = ['rent-vs-sell', 'management-fee-roi', 'eviction-cost', 'rent-reduction'];

// NOTE: deliberately excludes /homes/<id> — those pages are always served live by
// functions/homes/_middleware.js, so a stale crawled copy would just be dead weight.
const staticPages = [
  '/', '/accessibility', '/commercial', '/company', '/contact', '/homes', '/owners', '/residents'
];

async function savePage(urlPath, outRelPath) {
  const res = await fetch(BASE + urlPath);
  if (!res.ok) {
    console.error(`FAILED ${res.status}: ${urlPath}`);
    return { urlPath, status: res.status, ok: false };
  }
  const html = await res.text();
  const outPath = path.join(OUT, outRelPath);
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, html);
  return { urlPath, status: res.status, ok: true, bytes: html.length };
}

async function main() {
  const jobs = [];
  for (const p of staticPages) {
    const rel = p === '/' ? 'index.html' : `${p.slice(1)}/index.html`;
    jobs.push({ urlPath: p, rel });
  }
  for (const slug of communities) jobs.push({ urlPath: `/areas/${slug}`, rel: `areas/${slug}/index.html` });
  for (const slug of calculators) jobs.push({ urlPath: `/owners/calculators/${slug}`, rel: `owners/calculators/${slug}/index.html` });

  console.log(`Crawling ${jobs.length} pages from ${BASE}...`);
  const results = [];
  // Bounded concurrency — don't hammer the dev server (or the live upstream feed it
  // proxies through /areas/<slug>) with everything at once.
  const CONCURRENCY = 6;
  let idx = 0;
  async function worker() {
    while (idx < jobs.length) {
      const job = jobs[idx++];
      results.push(await savePage(job.urlPath, job.rel));
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const failed = results.filter(r => !r.ok);
  console.log(`Done. ${results.length - failed.length}/${results.length} succeeded.`);
  if (failed.length) {
    console.log('FAILED:', failed);
    process.exit(1);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
