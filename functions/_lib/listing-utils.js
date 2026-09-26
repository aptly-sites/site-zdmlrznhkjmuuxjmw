// Ported verbatim from lib/listing-utils.ts (stripped of type annotations only — same logic).
export const money = n =>
  n === null
    ? 'Contact leasing'
    : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
export const cityName = l => l.city.split(',')[0].trim();
export const normalizeCity = s => s.trim().toLowerCase().replace(/[’']/g, '').replace(/\s+/g, ' ');
export function safeHttps(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && !u.username && !u.password ? u.href : '';
  } catch {
    return '';
  }
}
export const listingPhotos = l => [...new Set((l.photos?.length ? l.photos : [l.image]).map(safeHttps).filter(Boolean))];
export const availability = l => (l.available === 'Now' ? 'Available now' : l.available ? 'Available ' + l.available : 'Contact for availability');
export const tourInquiry = l => 'mailto:leasing@spradleyproperties.com?subject=' + encodeURIComponent('Tour inquiry: ' + l.address);
export const hasCoordinates = l =>
  Number.isFinite(l.lat) && Number.isFinite(l.lng) && Math.abs(l.lat) <= 90 && Math.abs(l.lng) <= 180 && l.lat !== 0 && l.lng !== 0;
