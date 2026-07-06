export type HotelStatus = "draft" | "published";

export interface Hotel {
  id: string;
  name: string;
  slug: string;
  description: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string | null;
  country: string;
  postalCode: string | null;
  latitude: number;
  longitude: number;
  starRating: number;
  checkInTime: string;
  checkOutTime: string;
  freeCancellation: boolean;
  cancellationPolicy: string;
  status: HotelStatus;
  averageRating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface HotelImage {
  id: string;
  hotelId: string;
  url: string;
  isMain: boolean;
  sortOrder: number;
}

export interface Amenity {
  id: string;
  name: string;
  icon: string;
}

export interface HotelWithDetails extends Hotel {
  amenities: Amenity[];
  images: HotelImage[];
}

export interface HotelListItem {
  id: string;
  name: string;
  city: string;
  country: string;
  starRating: number;
  status: HotelStatus;
  mainImageUrl: string | null;
  createdAt: string;
}

export interface HotelInput {
  name: string;
  description: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  starRating: number;
  checkInTime: string;
  checkOutTime: string;
  freeCancellation: boolean;
  cancellationPolicy: string;
  status: HotelStatus;
  amenityIds: string[];
}

export interface HotelImageInput {
  url: string;
  isMain: boolean;
  sortOrder: number;
}
