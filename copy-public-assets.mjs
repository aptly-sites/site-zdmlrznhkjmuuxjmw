// Cloudflare Pages build step for this directory. images/ and videos/ aren't committed
// here — they're the same files already tracked at ../public/images and ../public/videos,
// so this just copies the current ones in at build time instead of duplicating ~76MB of
// binaries in git. Run before every deploy (see README.md for the Pages build command).
import { cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoPublic = path.join(here, '..', 'public');

for (const dir of ['images', 'videos']) {
  const from = path.join(repoPublic, dir);
  const to = path.join(here, dir);
  if (!existsSync(from)) {
    console.error(`Missing ${from} — is this running from inside the full repo checkout?`);
    process.exit(1);
  }
  await cp(from, to, { recursive: true });
  console.log(`Copied ${from} -> ${to}`);
}
