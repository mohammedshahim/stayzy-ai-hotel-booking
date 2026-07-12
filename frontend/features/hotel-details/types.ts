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

// Same shape with checkIn/checkOut defaulted (today/tomorrow, mirroring the backend's own
// fallback in hotels.controller.ts) — what a booking request or reserve-intent URL needs,
// since neither can be built from a still-null date range.
export type ResolvedRoomSelectionSearch = {
  checkIn: string;
  checkOut: string;
  adults: number;
  kids: number;
  rooms: number;
};

// Shape returned by GET /hotels/:id/similar — mirrors backend's SimilarHotel.
export type SimilarHotel = {
  id: string;
  name: string;
  city: string;
  country: string;
  starRating: number;
  averageRating: number;
  reviewCount: number;
  mainImageUrl: string | null;
};

// Shape returned by GET /hotels/:id/reviews — mirrors backend's HotelReviewsResult.
export type Review = {
  id: string;
  rating: number;
  description: string;
  createdAt: string;
  reviewerName: string;
  reviewerAvatarUrl: string | null;
};

export type RatingBreakdown = Record<1 | 2 | 3 | 4 | 5, number>;

export type PaginatedReviews = {
  data: Review[];
  page: number;
  pageSize: number;
  totalPages: number;
};

export type HotelReviewsResult = {
  averageRating: number;
  reviewCount: number;
  breakdown: RatingBreakdown;
  reviews: PaginatedReviews;
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
