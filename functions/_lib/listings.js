// Ported verbatim from lib/listings.ts (stripped of type annotations only — same logic,
// including its in-memory 5-minute cache pattern, same as the source app's Server Components
// used). Reads Spradley's own Rent Manager feed directly — this site does not use Aptly's
// portal listings feed the way EquityTeam/Blue Crown do.
import enrichment from './data/listing-locations.json';
import { safeHttps } from './listing-utils.js';
export { money } from './listing-utils.js';

const FEED =
  'https://sprad.ua.rentmanager.com/Search_Result?template=unitList&locations=default&fromsearch=fromsearch&headerfooter=false&maxperpage=99999&pidne=846&unituserdef_Show_on_websiteeq=yes';

export function decodeFeed(raw) {
  const m = raw.match(/document\.write\(("(?:[^"\\]|\\.)*")\);?/);
  if (!m) throw new Error('Unrecognized listing response');
  try {
    return JSON.parse(m[1]);
  } catch {
    throw new Error('Invalid listing response');
  }
}
function clean(s) {
  return s.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
}
export function parseListings(raw) {
  const html = decodeFeed(raw);
  if (!html.includes('list-item-container unit') && !/no (?:units|results|properties|listings)|<table>\s*<\/table>/i.test(html))
    throw new Error('Listing format changed');
  const blocks = html.split('<div class="list-item-container unit"').slice(1);
  return blocks
    .map(b => {
      const bold = [...b.matchAll(/<p class="bold-font">([\s\S]*?)<\/p>/g)].map(m => clean(m[1]));
      const val = label => clean(b.match(new RegExp(label + ' </span>([^<]*)'))?.[1] || '');
      const numeric = s => (s.trim() ? Number(s.replace(/[^\d.]/g, '')) : null);
      return {
        id: b.match(/data-unitid="(\d+)"/)?.[1] || '',
        address: bold[0] || '',
        city: bold[1] || '',
        rent: numeric(val('Rent')),
        deposit: numeric(val('Deposit')),
        beds: numeric(val('Beds')),
        baths: numeric(b.match(/var bath = '([\d.]+)'/)?.[1] || ''),
        sqft: numeric(val('Sqft')),
        available: b.match(/data-available-date="([^"]+)"/)?.[1] || '',
        image: b.match(/var background = '(https:[^']+)'/)?.[1] || '',
        apply: b.match(/href="(https:\/\/sprad\.twa\.rentmanager\.com\/ApplyNow[^" ]*)"/)?.[1] || ''
      };
    })
    .filter(l => l.id && l.address);
}
const seed = enrichment;
let cache;
let pending;
export async function getListings() {
  if (cache && Date.now() - cache.time < 300000) return cache.data;
  if (pending) return pending;
  pending = (async () => {
    const r = await fetch(FEED, { signal: AbortSignal.timeout(12000) });
    if (!r.ok) throw new Error('Listing service unavailable');
    const data = parseListings(await r.text()).map(l => {
      const item = seed[l.id];
      return item && item.address === l.address && item.city === l.city
        ? { ...l, lat: item.lat, lng: item.lng, photos: item.photos, propertyType: item.propertyType, showing: safeHttps(item.showing || '') }
        : l;
    });
    cache = { time: Date.now(), data };
    return data;
  })();
  try {
    return await pending;
  } finally {
    pending = undefined;
  }
}
export function parseDetail(html, listing) {
  const collection = (html.match(/var webcollection = '([^']+)'/)?.[1] || '').split('|');
  const exterior = html.match(/var eximg = '([^']+)'/)?.[1] || listing.image;
  const photos = [...new Set([exterior, ...collection].map(safeHttps).filter(u => u && new URL(u).hostname === 'rm12filereader.rentmanager.com'))];
  const withoutScripts = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  const description = clean(withoutScripts.match(/<div[^>]*class="[^"]*(?:description|unit-description)[^"]*"[^>]*>([\s\S]*?)<\/div>/i)?.[1] || '');
  const facts = {};
  const details = withoutScripts.match(/<div class="detail-items">([\s\S]*?)<\/div>/)?.[1] || '';
  for (const m of details.matchAll(/<span>([^<]+)<\/span>([^<]*)/g)) {
    const key = clean(m[1]).replace(/:\s*$/, '');
    const value = clean(m[2]);
    if (value) facts[key] = value;
  }
  const amenityHtml = withoutScripts.match(/<div class="amenity-wrap">([\s\S]*?)<\/div>/)?.[1] || '';
  const amenities = [...amenityHtml.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(m => clean(m[1]));
  const virtualTour = safeHttps(withoutScripts.match(/<iframe[^>]+src="([^"]+)"/)?.[1] || '');
  const explicit = html.match(/document\.write\('<a href = "(https:[^"]+)" target="_blank"><p>Schedule a showing/);
  const showing = explicit
    ? safeHttps(explicit[1])
    : html.includes('https://app.tenantturner.com/qualify/')
    ? 'https://app.tenantturner.com/qualify/' + listing.address.replace(/[.#]/g, '').split(',')[0].replace(/ /g, '-').toLowerCase() + '?p=Company'
    : '';
  return { listing: { ...listing, photos }, photos, description, facts, amenities, virtualTour, showing };
}
const detailsCache = new Map();
const detailPending = new Map();
export async function getDetail(id) {
  if (!/^\d+$/.test(id)) return null;
  const listing = (await getListings()).find(l => l.id === id);
  if (!listing) return null;
  const hit = detailsCache.get(id);
  if (hit && Date.now() - hit.time < 300000) return { ...hit.data, listing: { ...listing, photos: hit.data.photos } };
  if (detailPending.has(id)) return detailPending.get(id);
  const request = (async () => {
    try {
      const r = await fetch('https://sprad.ua.rentmanager.com/detail_view?template=unitlist&locations=default&id=' + id, {
        signal: AbortSignal.timeout(12000)
      });
      if (!r.ok) throw new Error('Detail unavailable');
      const data = parseDetail(decodeFeed(await r.text()), listing);
      detailsCache.set(id, { time: Date.now(), data });
      return data;
    } catch {
      return { listing, photos: [listing.image].filter(Boolean), description: '', facts: {}, amenities: [], virtualTour: '', showing: '', partial: true };
    }
  })();
  detailPending.set(id, request);
  try {
    return await request;
  } finally {
    detailPending.delete(id);
  }
}
