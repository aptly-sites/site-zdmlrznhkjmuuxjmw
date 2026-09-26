// Ported from app/api/listings/[id]/route.ts — logic unchanged. Next.js 15+'s async
// `{ params }: { params: Promise<...> }` convention becomes a plain `params` object on
// Pages Functions' context — no awaiting needed.
import { getDetail } from '../../_lib/listings.js';

export async function onRequestGet({ params }) {
  try {
    const data = await getDetail(params.id);
    return data
      ? Response.json(data, { headers: { 'Cache-Control': 'public,max-age=60' } })
      : Response.json({ error: 'This home is no longer available.' }, { status: 404 });
  } catch {
    return Response.json({ error: 'Property details are temporarily unavailable.' }, { status: 503 });
  }
}
