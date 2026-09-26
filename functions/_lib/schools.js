// Ported verbatim from lib/schools.ts (stripped of type annotations only — same logic).
const text = value => (typeof value === 'string' ? value.trim().slice(0, 400) : '');
const number = value => (typeof value === 'number' && Number.isFinite(value) ? value : null);

export function parseSchools(data, limit = 10) {
  if (!data || typeof data !== 'object' || !('schools' in data) || !Array.isArray(data.schools)) throw new Error('Invalid school response');
  const result = [];
  const seen = new Set();
  for (const row of data.schools) {
    if (!row || typeof row !== 'object') continue;
    const lat = number(row.lat),
      lng = number(row.lon),
      name = text(row.name),
      id = text(row['universal-id']);
    let url;
    try {
      url = new URL(text(row['overview-url']));
    } catch {
      continue;
    }
    if (
      !name ||
      !id ||
      seen.has(id) ||
      lat === null ||
      lng === null ||
      Math.abs(lat) > 90 ||
      Math.abs(lng) > 180 ||
      (lat === 0 && lng === 0) ||
      url.protocol !== 'https:' ||
      url.hostname !== 'www.greatschools.org' ||
      url.username ||
      url.password
    )
      continue;
    seen.add(id);
    const distance = number(row.distance);
    result.push({
      id,
      name,
      type: ['public', 'private', 'charter'].includes(row.type) ? row.type : '',
      grades: text(row.level).replace(/\bKG\b/g, 'K').replaceAll(',', ', '),
      address: [text(row.street), text(row.city), [text(row.state), text(row.zip)].filter(Boolean).join(' ')].filter(Boolean).join(', '),
      lat,
      lng,
      distance: distance !== null && distance >= 0 ? distance : null,
      url: url.href
    });
  }
  return result.slice(0, limit);
}
export async function fetchSchools(lat, lng, key) {
  const url = new URL('https://gs-api.greatschools.org/v2/nearby-schools');
  url.search = new URLSearchParams({ lat: String(lat), lon: String(lng), distance: '5', limit: '10' }).toString();
  const response = await fetch(url, { headers: { 'X-API-Key': key, Accept: 'application/json' }, cache: 'no-store', signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('School provider unavailable');
  return parseSchools(await response.json());
}

export async function fetchCitySchools(city, key) {
  const schools = [];
  const seen = new Set();
  for (let page = 0; page < 20; page++) {
    const url = new URL('https://gs-api.greatschools.org/v2/schools');
    url.search = new URLSearchParams({ city, state: 'TX', limit: '50', page: String(page) }).toString();
    const response = await fetch(url, { headers: { 'X-API-Key': key, Accept: 'application/json' }, cache: 'no-store', signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('School provider unavailable');
    const data = await response.json();
    const parsed = parseSchools(data, 50);
    for (const school of parsed) {
      if (!seen.has(school.id)) {
        seen.add(school.id);
        schools.push(school);
      }
    }
    if (data.schools.length < 50) return schools;
  }
  throw new Error('City result limit exceeded');
}
