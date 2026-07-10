import { findTopCitiesByHotelCount, findTopHotelImageForCity } from "../queries/trending-destinations.queries";

export interface TrendingDestination {
  city: string;
  country: string;
  hotelCount: number;
  mainImageUrl: string | null;
}

const TRENDING_LIMIT = 8;

// Ranked by published-hotel count per city (rating as tiebreaker) until real booking
// volume exists (Phase 5) — see build-plan.md's Feature 11 note. Swapping in the real
// ranking later only touches findTopCitiesByHotelCount; this function's shape stays put.
export async function getTrendingDestinations(): Promise<TrendingDestination[]> {
  const cities = await findTopCitiesByHotelCount(TRENDING_LIMIT);

  return Promise.all(
    cities.map(async (row) => ({
      city: row.city,
      country: row.country,
      hotelCount: row.hotelCount,
      mainImageUrl: await findTopHotelImageForCity(row.city, row.country),
    }))
  );
}
