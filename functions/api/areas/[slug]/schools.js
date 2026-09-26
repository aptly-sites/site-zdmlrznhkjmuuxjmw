// Ported from app/api/areas/[slug]/schools/route.ts — logic unchanged.
// GREATSCHOOLS_API_KEY comes from env (Cloudflare Pages env var), not process.env.
import { communities } from '../../../_lib/communities.js';
import { fetchCitySchools } from '../../../_lib/schools.js';

const headers = { 'Cache-Control': 'no-store, max-age=0', 'X-Content-Type-Options': 'nosniff' };
let active = 0;

export async function onRequestGet({ params, env }) {
  const { slug } = params;
  const city = communities.find(c => c.slug === slug);
  if (!city) return Response.json({ status: 'unavailable' }, { status: 404, headers });
  if (!env.GREATSCHOOLS_API_KEY || active >= 3) return Response.json({ status: 'unavailable' }, { status: 503, headers });
  active++;
  try {
    return Response.json({ status: 'ready', schools: await fetchCitySchools(city.name.replace('’', "'"), env.GREATSCHOOLS_API_KEY) }, { headers });
  } catch {
    return Response.json({ status: 'unavailable' }, { status: 503, headers });
  } finally {
    active--;
  }
}
