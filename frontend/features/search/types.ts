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
  landmarks: string[];
  sort: SortOption;
  view: ViewMode;
  page: number;
};
