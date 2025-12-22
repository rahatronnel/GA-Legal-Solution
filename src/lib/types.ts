export type PropertyImage = {
  id: string;
  url: string;
  hint: string;
};

export type Agent = {
  name: string;
  phone: string;
  avatarId: string;
};

export type PropertyDetails = {
  area: number; // in sqft
  bedrooms?: number;
  bathrooms?: number;
};

export type Property = {
  id: string;
  title: string;
  description: string;
  price: number;
  type: 'plot' | 'flat';
  isNearRoad: boolean;
  imageIds: string[];
  agent: Agent;
  details: PropertyDetails;
  ownerId?: string;
};
