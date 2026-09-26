// Ported from app/api/listings/route.ts — logic unchanged, entry point adapted from a Next.js
// Route Handler's GET() to a Cloudflare Pages Function's onRequestGet({ ... }).
import { getListings } from '../_lib/listings.js';

export async function onRequestGet() {
  try {
    return Response.json(
      { listings: await getListings(), fetchedAt: new Date().toISOString() },
      { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300' } }
    );
  } catch {
    return Response.json({ error: 'Current listings are temporarily unavailable. Please try again.' }, { status: 503 });
  }
}
