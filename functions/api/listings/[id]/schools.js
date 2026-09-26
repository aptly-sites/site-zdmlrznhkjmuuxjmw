// Ported from app/api/listings/[id]/schools/route.ts — logic unchanged, including its
// per-isolate rate-limit window (a real limit on the whole warm Worker instance, same
// approximation the source Next.js server made for its own single "server instance").
// GREATSCHOOLS_API_KEY comes from env (Cloudflare Pages env var), not process.env.
import { getListings } from '../../../_lib/listings.js';
import { hasCoordinates } from '../../../_lib/listing-utils.js';
import { fetchSchools } from '../../../_lib/schools.js';

const headers = { 'Cache-Control': 'no-store, max-age=0', 'X-Content-Type-Options': 'nosniff' };
const reply = (body, status = 200) => Response.json(body, { status, headers });

let windowStart = 0,
  calls = 0;

export async function onRequestGet({ params, env }) {
  const { id } = params;
  if (!/^\d{1,12}$/.test(id)) return reply({ status: 'unavailable' }, 404);
  try {
    const listing = (await getListings()).find(home => home.id === id);
    if (!listing) return reply({ status: 'unavailable' }, 404);
    if (!hasCoordinates(listing)) return reply({ status: 'no-location', schools: [] });
    const key = env.GREATSCHOOLS_API_KEY;
    if (!key) return reply({ status: 'unavailable' }, 503);
    const now = Date.now();
    if (now - windowStart >= 1000) {
      windowStart = now;
      calls = 0;
    }
    if (++calls > 8) return reply({ status: 'unavailable' }, 429);
    return reply({ status: 'ready', schools: await fetchSchools(listing.lat, listing.lng, key) });
  } catch {
    return reply({ status: 'unavailable' }, 503);
  }
}
