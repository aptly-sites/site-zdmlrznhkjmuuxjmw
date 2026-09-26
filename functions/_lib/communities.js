// Ported verbatim from lib/communities.ts (stripped of the `as const` type assertion only).
export const communities = [
  { name: 'Temple', slug: 'temple', lat: 31.0982, lng: -97.3428, image: '/images/temple-mural.webp', landmark: 'Downtown Temple mural', label: 'right' },
  { name: 'Belton', slug: 'belton', lat: 31.056, lng: -97.4645, image: '/images/areas/belton.webp', landmark: 'Bell County Courthouse', label: 'left' },
  { name: 'Salado', slug: 'salado', lat: 30.9471, lng: -97.5386, image: '/images/areas/salado.webp', landmark: 'Historic Stagecoach Inn', label: 'left' },
  { name: 'Killeen', slug: 'killeen', lat: 31.1171, lng: -97.7278, image: '/images/areas/killeen.webp', landmark: 'Historic downtown', label: 'top' },
  {
    name: 'Harker Heights',
    slug: 'harker-heights',
    lat: 31.0835,
    lng: -97.6597,
    image: '/images/areas/harker-heights.webp',
    landmark: 'Dana Peak Park',
    label: 'bottom'
  },
  { name: 'Troy', slug: 'troy', lat: 31.2068, lng: -97.3028, image: '/images/areas/troy.webp', landmark: 'East Main Street', label: 'top' },
  {
    name: 'Little River-Academy',
    slug: 'little-river-academy',
    lat: 30.9863,
    lng: -97.3556,
    image: '/images/areas/little-river-academy.webp',
    landmark: 'Historic Academy gymnasium',
    label: 'bottom'
  },
  {
    name: 'Morgan’s Point Resort',
    slug: 'morgans-point-resort',
    lat: 31.1513,
    lng: -97.4606,
    image: '/images/areas/morgans-point-resort.webp',
    landmark: 'Morgan’s Point Resort Marina',
    label: 'top'
  }
];
