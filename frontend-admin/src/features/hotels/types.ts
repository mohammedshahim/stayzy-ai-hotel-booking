import type { Amenity } from "@/features/amenities/types";

export type HotelStatus = "draft" | "published";

export type { Amenity };

export interface HotelImage {
  id: string;
  hotelId: string;
  url: string;
  isMain: boolean;
  sortOrder: number;
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
  amenities: Amenity[];
  images: HotelImage[];
}

export interface HotelFormInput {
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

export interface ListHotelsResponse {
  items: HotelListItem[];
  total: number;
}
