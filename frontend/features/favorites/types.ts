export type FavoriteHotel = {
  id: string;
  name: string;
  city: string;
  country: string;
  starRating: number;
  averageRating: number;
  reviewCount: number;
  mainImageUrl: string | null;
  fromPrice: number | null;
  savedAt: string;
};
