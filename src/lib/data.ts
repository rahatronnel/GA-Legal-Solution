import type { Property } from './types';

// This file is now a fallback and is not actively used.
// Data is fetched from Firestore in src/app/page.tsx
export const properties: Property[] = [
  {
    id: '1',
    title: 'Modern Downtown Flat',
    description:
      'A stunning 2-bedroom flat in the heart of the city. Features a modern kitchen, spacious living area, and breathtaking city views. Close to all amenities and public transport.',
    price: 450000,
    type: 'flat',
    location: { lat: 34.052235, lng: -118.243683 },
    isNearRoad: true,
    imageIds: ['prop-1-1', 'prop-1-2'],
    agent: {
      name: 'Jane Doe',
      phone: '123-456-7890',
      avatarId: 'agent-1',
    },
    details: {
      area: 1200,
      bedrooms: 2,
      bathrooms: 2,
    },
  },
  {
    id: '2',
    title: 'Spacious Residential Plot',
    description:
      'An excellent 5-acre plot perfect for building your dream home. Located in a quiet, serene neighborhood with lush greenery. Water and electricity access available.',
    price: 150000,
    type: 'plot',
    location: { lat: 34.152235, lng: -118.243683 },
    isNearRoad: false,
    imageIds: ['prop-2-1'],
    agent: {
      name: 'John Smith',
      phone: '098-765-4321',
      avatarId: 'agent-2',
    },
    details: {
      area: 217800, // 5 acres in sqft
    },
  },
];
