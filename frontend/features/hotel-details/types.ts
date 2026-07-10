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
