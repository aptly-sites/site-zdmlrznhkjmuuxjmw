// Manual, occasional-use helper — NOT part of any deploy pipeline. images/ and videos/
// in this directory are committed directly (see ../README.md for why: this directory
// must import as a pure static mirror via Aptly's own site-import tooling, which has no
// build step and no access to anything outside it, so a build-time copy silently
// produced a site with every image/video broken). If the real app's public/images or
// public/videos ever change, run this to refresh the committed copies here, then review
// and commit the diff — don't wire this into any build command.
import { cp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const exportDir = path.join(here, '..');
const repoPublic = path.join(exportDir, '..', 'public');

for (const dir of ['images', 'videos']) {
  const from = path.join(repoPublic, dir);
  const to = path.join(exportDir, dir);
  if (!existsSync(from)) {
    console.error(`Missing ${from} — is this running from inside the full repo checkout?`);
    process.exit(1);
  }
  await rm(to, { recursive: true, force: true });
  await cp(from, to, { recursive: true });
  console.log(`Resynced ${to} from ${from}`);
}
