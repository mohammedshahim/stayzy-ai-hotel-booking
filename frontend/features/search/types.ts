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
  near: string | null;
  radiusKm: number | null;
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

// Shape returned by GET /search — matches backend/src/services/search.service.ts's SearchResultHotel.
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
  distanceKm: number | null;
};

// null when `near` was set but neither a hotel name nor the geocoder could place it.
export type SearchAnchor = {
  label: string;
  latitude: number;
  longitude: number;
};

export type SearchApiResponse = {
  items: SearchResultHotel[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  anchor: SearchAnchor | null;
};

// Lookup rows from GET /amenities, /room-features, /meal-plans, used to render filter labels.
export type CatalogOption = {
  id: string;
  name: string;
};

export type ExtractedSearchFilters = {
  destination?: string;
  near?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  kids?: number;
  rooms?: number;
  minPrice?: number;
  maxPrice?: number;
  starRatings?: number[];
  minGuestRating?: number;
  amenities?: string[];
  roomFeatures?: string[];
  mealPlans?: string[];
  freeCancellationOnly?: boolean;
  sort?: SortOption;
};

export type SearchFilterExtraction = {
  filters: ExtractedSearchFilters;
  unmapped: string[];
};
