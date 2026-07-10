export type HotelAmenity = {
  id: string;
  name: string;
  icon: string;
};

export type HotelImage = {
  id: string;
  url: string;
  isMain: boolean;
  sortOrder: number;
};

// Shape returned by GET /hotels/:id — mirrors backend's HotelWithDetails
// (hotels.queries.ts's HOTEL_COLUMNS + amenities + images).
export type HotelDetails = {
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
  averageRating: number;
  reviewCount: number;
  amenities: HotelAmenity[];
  images: HotelImage[];
};

// Local page state driving the room type list — seeded from the search page's URL params
// (see HotelCard's link) but not itself synced back to this page's URL.
export type RoomSelectionSearch = {
  checkIn: string | null;
  checkOut: string | null;
  adults: number;
  kids: number;
  rooms: number;
};

export type RoomTypeFeature = {
  id: string;
  name: string;
};

export type RoomTypeImage = {
  id: string;
  url: string;
  isMain: boolean;
  sortOrder: number;
};

// Shape returned by GET /hotels/:id/room-types — mirrors backend's
// RoomTypeAvailabilityDetails (room-type.service.ts).
export type RoomTypeAvailability = {
  id: string;
  name: string;
  description: string;
  maxAdults: number;
  maxKids: number;
  basePrice: number;
  totalInventory: number;
  freeCancellation: boolean | null;
  mealPlanName: string;
  avgNightlyPrice: number;
  remainingInventory: number;
  isSoldOut: boolean;
  features: RoomTypeFeature[];
  images: RoomTypeImage[];
};
