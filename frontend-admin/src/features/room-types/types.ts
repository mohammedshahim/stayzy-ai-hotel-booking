import type { RoomFeature } from "@/features/room-features/types";

export interface RoomTypeImage {
  id: string;
  roomTypeId: string;
  url: string;
  isMain: boolean;
  sortOrder: number;
}

export interface RoomType {
  id: string;
  hotelId: string;
  name: string;
  description: string;
  maxAdults: number;
  maxKids: number;
  basePrice: number;
  totalInventory: number;
  // null = inherit the hotel's free_cancellation default, true/false = explicit override.
  freeCancellation: boolean | null;
  mealPlanId: string | null;
  createdAt: string;
  updatedAt: string;
  features: RoomFeature[];
  images: RoomTypeImage[];
}

export interface RoomTypeFormInput {
  name: string;
  description: string;
  maxAdults: number;
  maxKids: number;
  basePrice: number;
  totalInventory: number;
  freeCancellation: boolean | null;
  mealPlanId: string | null;
  roomFeatureIds: string[];
}

export interface RateOverrideRange {
  startDate: string;
  endDate: string;
  price: number | null;
  availableOverride: number | null;
}

export interface RateOverrideRangeInput {
  startDate: string;
  endDate: string;
  price: number | null;
  availableOverride: number | null;
}
