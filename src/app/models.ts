export type Role = 'OWNER' | 'SEEKER';

export type RentalCategory = 'BIKE' | 'CAR' | 'PROPERTY';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Listing {
  id: string;
  ownerId: string;
  ownerName?: string;
  title: string;
  description?: string;
  category: RentalCategory;
  pricePerDay: number;
  areaName: string;
  city?: string;
  addressLine?: string;
  latitude: number;
  longitude: number;
  imageUrls: string[];
  available: boolean;
  contactPhone?: string;
  distanceKm?: number;
}

export interface ListingRequest {
  title: string;
  description?: string;
  category: RentalCategory;
  pricePerDay: number;
  areaName: string;
  city?: string;
  addressLine?: string;
  latitude: number;
  longitude: number;
  imageUrls?: string[];
  available?: boolean;
  contactPhone?: string;
}

export interface SearchParams {
  category?: RentalCategory | '';
  lat?: number;
  lng?: number;
  radiusKm?: number;
  area?: string;
  maxPrice?: number;
}
