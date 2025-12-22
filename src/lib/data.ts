import type { Property } from './types';

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
  {
    id: '3',
    title: 'Cozy Suburban Home',
    description:
      'Charming 3-bedroom home in a family-friendly suburb. Features a large backyard, a newly renovated kitchen, and a two-car garage. Close to top-rated schools and parks.',
    price: 650000,
    type: 'flat',
    location: { lat: 34.052235, lng: -118.343683 },
    isNearRoad: true,
    imageIds: ['prop-3-1', 'prop-3-2'],
    agent: {
      name: 'Jane Doe',
      phone: '123-456-7890',
      avatarId: 'agent-1',
    },
    details: {
      area: 2200,
      bedrooms: 3,
      bathrooms: 2.5,
    },
  },
  {
    id: '4',
    title: 'Prime Commercial Plot',
    description:
      'A 10-acre commercial plot with excellent road frontage. Ideal for developing a shopping center, office complex, or warehouse. Zoned for commercial use.',
    price: 1200000,
    type: 'plot',
    location: { lat: 33.952235, lng: -118.243683 },
    isNearRoad: true,
    imageIds: ['prop-4-1'],
    agent: {
      name: 'John Smith',
      phone: '098-765-4321',
      avatarId: 'agent-2',
    },
    details: {
      area: 435600, // 10 acres in sqft
    },
  },
  {
    id: '5',
    title: 'Luxury Penthouse Suite',
    description:
      'Experience luxury living in this exclusive penthouse. With panoramic city views, a private rooftop terrace, and premium finishes, this 4-bedroom suite is the pinnacle of urban elegance.',
    price: 2500000,
    type: 'flat',
    location: { lat: 34.082235, lng: -118.273683 },
    isNearRoad: true,
    imageIds: ['prop-5-1', 'prop-5-2'],
    agent: {
      name: 'Jane Doe',
      phone: '123-456-7890',
      avatarId: 'agent-1',
    },
    details: {
      area: 4500,
      bedrooms: 4,
      bathrooms: 5,
    },
  },
  {
    id: '6',
    title: 'Secluded Lakeside Plot',
    description:
      'A beautiful and secluded 3-acre plot right by the lake. Your private getaway for a cabin or vacation home. Enjoy fishing, boating, and tranquility.',
    price: 320000,
    type: 'plot',
    location: { lat: 34.252235, lng: -118.443683 },
    isNearRoad: false,
    imageIds: ['prop-6-1'],
    agent: {
      name: 'John Smith',
      phone: '098-765-4321',
      avatarId: 'agent-2',
    },
    details: {
      area: 130680, // 3 acres in sqft
    },
  },
];
