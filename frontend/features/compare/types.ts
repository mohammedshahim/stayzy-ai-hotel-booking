// Shape returned by GET /hotels/compare — matches backend's CompareHotelRow exactly.
export type CompareHotel = {
  id: string;
  name: string;
  city: string;
  country: string;
  starRating: number;
  averageRating: number;
  reviewCount: number;
  mainImageUrl: string | null;
  fromPrice: number | null;
  cancellationPolicy: string;
  freeCancellation: boolean;
  amenities: string[];
};

// Shape returned by GET /hotels/search-suggestions — the /compare page's "add hotel" box.
export type HotelSearchSuggestion = {
  id: string;
  name: string;
  city: string;
  country: string;
  mainImageUrl: string | null;
};
