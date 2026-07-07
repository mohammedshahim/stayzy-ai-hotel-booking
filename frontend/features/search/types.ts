export type SortOption =
  | "recommended"
  | "price_asc"
  | "price_desc"
  | "guest_rating"
  | "star_rating"
  | "distance";

export type ViewMode = "list" | "grid" | "map";

export type SearchState = {
  destination: string;
  checkIn: string | null;
  checkOut: string | null;
  adults: number;
  kids: number;
  rooms: number;
  minPrice: number | null;
  maxPrice: number | null;
  starRatings: number[];
  minGuestRating: number | null;
  amenities: string[];
  roomFeatures: string[];
  mealPlans: string[];
  freeCancellationOnly: boolean;
  sort: SortOption;
  view: ViewMode;
  page: number;
};

// Shape returned by GET /search — matches backend/src/services/search.service.ts's
// SearchResultHotel exactly (id, lat/lng, and the cheapest qualifying room type's
// display fields for the selected dates/party size).
export type SearchResultHotel = {
  id: string;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  image: string | null;
  starRating: number;
  guestRating: number;
  reviewCount: number;
  amenities: string[];
  roomType: string;
  mealPlan: string;
  roomFeatures: string[];
  freeCancellation: boolean;
  pricePerNight: number;
};

export type SearchApiResponse = {
  items: SearchResultHotel[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// { id, name } lookup rows from GET /amenities, /room-features, /meal-plans —
// used to render filter option labels while SearchState stores the ids.
export type CatalogOption = {
  id: string;
  name: string;
};
