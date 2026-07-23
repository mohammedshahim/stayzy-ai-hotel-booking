import { searchHotels, type SearchResponse } from "./search.service";
import { resolveSearchAnchor } from "./search-anchor.service";
import { loadFilterVocabulary, resolveNames } from "./filter-vocabulary.service";
import type { InternalSearchQuery } from "../types/internal-search.schemas";
import { todayIso, tomorrowIso } from "../utils/date";

export interface InternalSearchResponse extends SearchResponse {
  unresolvedFilters: string[];
}

export async function searchHotelsByFilterNames(
  query: InternalSearchQuery,
): Promise<InternalSearchResponse> {
  const { amenities, roomFeatures, mealPlans } = await loadFilterVocabulary();

  const matchedAmenities = resolveNames(query.amenities, amenities);
  const matchedRoomFeatures = resolveNames(query.roomFeatures, roomFeatures);
  const matchedMealPlans = resolveNames(query.mealPlans, mealPlans);

  const checkIn = query.checkIn ?? todayIso();
  const checkOut = query.checkOut ?? tomorrowIso();
  const anchor = query.near ? await resolveSearchAnchor(query.near) : null;

  const result = await searchHotels({
    destination: query.destination,
    anchor,
    radiusKm: query.radiusKm,
    checkIn,
    checkOut,
    adults: query.adults,
    kids: query.kids,
    rooms: query.rooms,
    minPrice: query.minPrice ?? null,
    maxPrice: query.maxPrice ?? null,
    starRatings: query.starRatings,
    minGuestRating: query.minGuestRating ?? null,
    amenityIds: matchedAmenities.ids,
    mealPlanIds: matchedMealPlans.ids,
    roomFeatureIds: matchedRoomFeatures.ids,
    freeCancellationOnly: query.freeCancellationOnly ?? false,
    sort: query.sort,
    page: 1,
    pageSize: query.pageSize,
  });

  return {
    ...result,
    unresolvedFilters: [
      ...matchedAmenities.unresolved,
      ...matchedRoomFeatures.unresolved,
      ...matchedMealPlans.unresolved,
    ],
  };
}
