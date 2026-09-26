// Hand-written equivalent of app/homes/[id]/page.tsx + its sub-components
// (rental-controls.tsx, rental-gallery.tsx, virtual-tour.tsx, nearby-schools.tsx,
// listing-card.tsx) for use in a Pages Functions middleware — see
// functions/homes/_middleware.js. This is NOT a byte-for-byte port like Blue Crown's
// listing-render.mjs was (there is no such plain-template source here — this page's
// real output is produced by React 19 Server Component streaming, with content
// delivered via out-of-order <template>/hidden-div slots, not a single static block).
// This reconstructs the same final visual result from the JSX source, using the same
// CSS classes (so the site's already-deployed stylesheet renders it identically), but
// as plain non-streaming HTML with small vanilla-JS replacements for what were
// stateful React interactions:
//   - Photo carousel: a plain prev/next script instead of React state.
//   - Nearby schools: a plain fetch()-on-load script hitting the same
//     /api/listings/:id/schools Pages Function the original component called.
//   - Virtual tour: a plain <iframe>, no lazy-load-on-scroll/timeout handling.
//   - Comparison tool, map view: not reproduced — those live on /homes (kept as the
//     existing crawled snapshot per the accepted trade-off, see docs).
import { esc } from './esc.js';
import { money, cityName, availability, tourInquiry, safeHttps, listingPhotos } from './listing-utils.js';

function factRow(label, value) {
  if (value === undefined || value === null || value === '') return '';
  return `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`;
}

function renderGallery(listing) {
  const photos = listingPhotos(listing);
  if (!photos.length) {
    return `<div class="rental-photo-carousel large-carousel"><div class="photo-unavailable">Photos coming soon</div><span class="available-label">${esc(
      availability(listing)
    )}</span></div>`;
  }
  const slides = photos
    .map(
      (p, i) =>
        `<img src="${esc(p)}" alt="${esc(listing.address)} — photo ${i + 1}" data-slide="${i}" ${
          i === 0 ? '' : 'hidden'
        } loading="${i === 0 ? 'eager' : 'lazy'}">`
    )
    .join('');
  return `<div class="rental-photo-carousel large-carousel" data-gallery data-count="${photos.length}">
  <div class="photo-open" aria-label="Photo gallery for ${esc(listing.address)}">${slides}</div>
  <span class="available-label">${esc(availability(listing))}</span>
  ${
    photos.length > 1
      ? `<button type="button" class="photo-prev" aria-label="Previous photo" data-gallery-prev>‹</button><button type="button" class="photo-next" aria-label="Next photo" data-gallery-next>›</button>`
      : ''
  }
  <span class="photo-count" data-gallery-count>1 / ${photos.length}</span>
</div>`;
}

const GALLERY_SCRIPT = `<script>document.querySelectorAll('[data-gallery]').forEach(function(g){var imgs=g.querySelectorAll('[data-slide]');var count=g.querySelector('[data-gallery-count]');var i=0;function show(n){i=(n+imgs.length)%imgs.length;imgs.forEach(function(img,idx){img.hidden=idx!==i});if(count)count.textContent=(i+1)+' / '+imgs.length}var prev=g.querySelector('[data-gallery-prev]'),next=g.querySelector('[data-gallery-next]');if(prev)prev.addEventListener('click',function(){show(i-1)});if(next)next.addEventListener('click',function(){show(i+1)})});</script>`;

function renderShareButton(listing) {
  return `<span class="share-home"><button type="button" class="card-tool" data-share="${esc(
    listing.id
  )}" data-address="${esc(listing.address)}" aria-label="Share ${esc(listing.address)}"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"></line><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"></line></svg><span data-share-label>Share</span></button></span>`;
}
const SHARE_SCRIPT = `<script>document.querySelectorAll('[data-share]').forEach(function(btn){btn.addEventListener('click',function(){var url=window.location.origin+'/homes/'+btn.getAttribute('data-share');var label=btn.querySelector('[data-share-label]');(navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(url):Promise.reject()).then(function(){if(label){label.textContent='Copied';setTimeout(function(){label.textContent='Share'},2500)}}).catch(function(){prompt('Copy this link',url)})})});</script>`;

function renderVirtualTour(url, address) {
  if (!url) return '';
  return `<section class="rental-detail-section" id="virtual-tour"><p class="eyebrow">STEP INSIDE</p><h2>Take a look around.</h2><div class="virtual-tour-frame"><iframe class="property-virtual-tour" src="${esc(
    url
  )}" title="Spradley virtual tour for ${esc(
    address
  )}" loading="lazy" allow="autoplay; fullscreen; xr-spatial-tracking" allowfullscreen></iframe></div><div class="virtual-tour-actions"><a class="text-link" href="${esc(
    url
  )}" target="_blank" rel="noreferrer">Open virtual tour in a new tab ↗</a></div><p class="rental-disclaimer">Tours may show a similar unit. Confirm the exact layout and finishes with our leasing team.</p></section>`;
}

function renderNearbySchools(listing) {
  const hasCoords = Number.isFinite(listing.lat) && Number.isFinite(listing.lng) && listing.lat !== 0 && listing.lng !== 0;
  const area =
    'https://www.google.com/maps/search/?api=1&query=' +
    encodeURIComponent(hasCoords ? `${listing.lat},${listing.lng}` : `${listing.address} ${listing.city}`);
  return `<section class="rental-detail-section nearby-schools" aria-labelledby="nearby-schools-title" data-schools="${esc(
    listing.id
  )}" data-has-coords="${hasCoords ? '1' : ''}"><p class="eyebrow">GET TO KNOW THE AREA</p><h2 id="nearby-schools-title">Nearby schools.</h2>
  ${
    hasCoords
      ? `<div class="school-results" aria-live="polite" data-schools-results><p class="school-message">Loading nearby schools…</p></div>`
      : `<p>Nearby school locations are unavailable for this address.</p>`
  }
  <div class="school-footer"><a class="text-link" href="${esc(area)}" target="_blank" rel="noreferrer">Explore the area ↗</a></div>
</section>`;
}
const SCHOOLS_SCRIPT = `<script>document.querySelectorAll('[data-schools]').forEach(function(section){if(!section.getAttribute('data-has-coords'))return;var id=section.getAttribute('data-schools');var box=section.querySelector('[data-schools-results]');fetch('/api/listings/'+encodeURIComponent(id)+'/schools',{cache:'no-store'}).then(function(r){return r.json()}).then(function(data){if(data.status!=='ready'||!Array.isArray(data.schools))throw 0;if(!data.schools.length){box.innerHTML='<p class="school-message">No nearby schools were returned within five miles.</p>';return}box.innerHTML='<ol class="school-list">'+data.schools.map(function(s,i){var meta=[s.type?s.type[0].toUpperCase()+s.type.slice(1):'',s.grades?'Grades '+s.grades:'',s.distance!=null?s.distance.toFixed(1)+' mi':''].filter(Boolean).join(' · ');return '<li><span class="school-list-number">'+(i+1)+'</span><div><a href="'+s.url+'" target="_blank" rel="nofollow noopener noreferrer">'+s.name+' ↗</a><p>'+meta+'</p><p>'+(s.address||'')+'</p></div></li>'}).join('')+'</ol>'}).catch(function(){box.innerHTML='<div class="school-message"><h3>School information is currently unavailable.</h3><p>You can still explore the home’s location on the map.</p></div>'})});</script>`;

function renderListingCardMini(l) {
  const photos = listingPhotos(l);
  const img = photos[0];
  return `<article id="home-${esc(l.id)}" class="listing-card rental-card" aria-label="${esc(l.address)}">
  <div class="rental-photo-carousel">${
    img
      ? `<a href="/homes/${esc(l.id)}"><img src="${esc(img)}" alt="${esc(l.address)} — photo 1" loading="lazy"></a>`
      : `<div class="photo-unavailable">Photos coming soon</div>`
  }<span class="available-label">${esc(availability(l))}</span></div>
  <div class="listing-info"><p class="listing-price">${money(l.rent)} <span>/ month</span></p><a href="/homes/${esc(
    l.id
  )}"><h3>${esc(l.address)}</h3></a><p class="listing-city">${esc(l.city)}</p><div class="listing-specs"><span>${
    l.beds ?? '—'
  } beds</span><span>${l.baths ?? '—'} baths</span><span>${
    l.sqft === null ? 'Contact leasing' : l.sqft.toLocaleString()
  } sq ft</span></div><div class="rental-card-actions"><a class="rental-action-tour" href="${esc(
    safeHttps(l.showing || '') || tourInquiry(l)
  )}">Tour</a>${
    safeHttps(l.apply) ? `<a href="${esc(safeHttps(l.apply))}">Apply</a>` : `<span aria-disabled="true">Apply</span>`
  }<a href="/homes/${esc(l.id)}">View details <span aria-hidden="true">↗</span></a></div></div>
</article>`;
}

// Mirrors generateMetadata() from app/homes/[id]/page.tsx.
export function renderHomeMeta(detail, id) {
  const url = 'https://spradley-properties.sshekou.chatgpt.site/homes/' + id;
  if (!detail) {
    return { title: 'Rental home', description: 'Find your next home with Spradley Properties.', canonical: url, ogImage: '' };
  }
  return {
    title: detail.listing.address + ' | Homes for Rent',
    description: (detail.description || '').slice(0, 155) || 'Find your next home with Spradley Properties.',
    canonical: url,
    ogImage: detail.photos?.[0] || ''
  };
}

// Mirrors the Detail component's body (the <main> content) — matches
// app/homes/[id]/page.tsx's JSX structure and CSS classes.
export function renderHomeDetail(detail, related) {
  const { listing: l, photos, description, facts, amenities, virtualTour, showing } = detail;
  const city = cityName(l);
  const address = l.address;
  const propertyFacts = [
    ['Property type', facts.Type],
    ['Availability', availability(l)],
    ['Security deposit', money(l.deposit)],
    ['Pets', facts.Pets || 'Contact leasing for pet details'],
    ['Landscaping', facts.Landscaping],
    ['School district', facts['School District']],
    ['HOA', facts.HOA],
    ['Electric', facts.Electric],
    ['Water', facts.Water],
    ['Trash', facts.Trash],
    ['Gas', facts.Gas]
  ]
    .map(([label, value]) => factRow(label, value))
    .join('');

  const structured = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: address,
    url: 'https://spradley-properties.sshekou.chatgpt.site/homes/' + l.id,
    description,
    image: photos.slice(0, 4),
    ...(l.rent !== null ? { offers: { '@type': 'Offer', price: l.rent, priceCurrency: 'USD', businessFunction: 'http://purl.org/goodrelations/v1#LeaseOut' } } : {})
  };

  return `<main id="main" class="rental-detail wrap">
<script type="application/ld+json">${JSON.stringify(structured).replace(/</g, '\\u003c')}</script>
<div class="rental-detail-top"><a href="/homes" class="breadcrumb">← Back to available homes</a>${renderShareButton(l)}</div>
${renderGallery(l)}
<div class="rental-detail-layout">
  <div>
    <p class="eyebrow">${esc(city.toUpperCase())} · YOUR NEXT CHAPTER</p>
    <h1>${esc(address)}</h1>
    <p class="rental-detail-city">${esc(l.city)}</p>
    <div class="rental-key-facts">
      <div><strong>${money(l.rent)}</strong><span>Monthly rent</span></div>
      <div><strong>${l.beds ?? '—'}</strong><span>Bedrooms</span></div>
      <div><strong>${l.baths ?? '—'}</strong><span>Bathrooms</span></div>
      <div><strong>${l.sqft === null ? 'Contact leasing' : l.sqft.toLocaleString()}</strong><span>Square feet</span></div>
    </div>
    ${detail.partial ? `<p class="notice">Some property details are temporarily unavailable. Please contact our team to confirm features and terms.</p>` : ''}
    <section class="rental-detail-section"><h2>A place to make your own.</h2><p class="property-description">${esc(
      description || 'Contact our local leasing team for property features, utilities, and tour availability.'
    )}</p></section>
    <section class="rental-detail-section"><h2>The details that matter.</h2><dl class="property-facts">${propertyFacts}</dl></section>
    <section class="rental-detail-section"><h2>At home here.</h2>${
      amenities.length
        ? `<ul class="property-amenities">${amenities.map(a => `<li>${esc(a)}</li>`).join('')}</ul>`
        : `<p>Contact Spradley for amenity details.</p>`
    }</section>
    ${renderVirtualTour(safeHttps(virtualTour), address)}
    <section class="rental-detail-section"><h2>Plan your next step.</h2>
      <details class="rental-faq" open><summary>How can I see this home?</summary><p>${
        showing ? 'Use the scheduling link to check the showing options for this home.' : 'Contact our leasing team to ask about tour availability.'
      }</p><a class="text-link" href="${esc(showing || tourInquiry(l))}">${showing ? 'Check showing availability' : 'Ask about a tour'} ↗</a></details>
      <details class="rental-faq"><summary>What costs should I plan for?</summary><p>Listed monthly rent is ${money(
        l.rent
      )} and the security deposit is ${money(l.deposit)}. Application fees, any recurring charges, and final lease terms should be confirmed with our team.</p></details>
      <details class="rental-faq"><summary>What do I need to apply?</summary><p>Review Spradley’s current requirements before submitting an application.</p><a class="text-link" href="https://spradleyproperties.com/application-requirements/">Application requirements ↗</a></details>
    </section>
  </div>
  <aside class="rental-booking">
    <p class="eyebrow">PICTURE YOURSELF HERE?</p><h2>${money(l.rent)}<span> / month</span></h2><p class="booking-availability">${esc(availability(l))}</p>
    <div class="booking-cost"><span>Security deposit</span><strong>${money(l.deposit)}</strong></div>
    <a href="${esc(showing || tourInquiry(l))}" class="button red">${showing ? 'Schedule a tour' : 'Ask about a tour'}</a>
    ${safeHttps(l.apply) ? `<a href="${esc(safeHttps(l.apply))}" class="button outline">Apply now</a>` : ''}
    <hr><p>Questions? We’re here to help.</p><a href="tel:2547427733" class="booking-phone">254.742.7733</a><a href="${esc(
      tourInquiry(l)
    )}" class="booking-email">Email our leasing team ↗</a>
    <p class="rental-disclaimer">Pricing and availability may change. Confirm all fees and terms before applying.</p>
  </aside>
</div>
${renderNearbySchools(l)}
${
  related.length
    ? `<section class="related-homes"><p class="eyebrow">KEEP EXPLORING</p><h2>More places to call home.</h2><div class="listing-grid">${related
        .map(renderListingCardMini)
        .join('')}</div></section>`
    : ''
}
${GALLERY_SCRIPT}${SHARE_SCRIPT}${SCHOOLS_SCRIPT}
</main>`;
}

export function renderHomeNotFound() {
  return `<main id="main" class="wrap section"><p class="eyebrow">LET’S FIND WHAT’S NEXT</p><h1>This home is no longer available.</h1><p>Explore our current listings to find another place to call home.</p><a class="button red" href="/homes">See available homes</a></main>`;
}
export function renderHomeError(id) {
  return `<main id="main" class="wrap section"><h1>We couldn’t load this home.</h1><p>Please try again or contact our leasing team.</p><a href="/homes/${esc(
    id
  )}" class="error-link">Try again</a><a href="/homes" class="error-link">Back to available homes</a></main>`;
}
