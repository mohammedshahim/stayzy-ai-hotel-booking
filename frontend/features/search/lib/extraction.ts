import type { SearchCatalogs } from "@/features/search/hooks/useSearchCatalogs";
import type { CatalogOption, ExtractedSearchFilters, SearchState } from "@/features/search/types";

function namesOf(ids: string[], options: CatalogOption[]): string[] {
  const nameById = new Map(options.map((option) => [option.id, option.name]));
  return ids.map((id) => nameById.get(id) ?? id);
}

export function toSearchState(filters: ExtractedSearchFilters): Partial<SearchState> {
  const partial: Partial<SearchState> = {};

  if (filters.destination !== undefined) partial.destination = filters.destination;
  if (filters.near !== undefined) partial.near = filters.near;
  if (filters.checkIn !== undefined) partial.checkIn = filters.checkIn;
  if (filters.checkOut !== undefined) partial.checkOut = filters.checkOut;
  if (filters.adults !== undefined) partial.adults = filters.adults;
  if (filters.kids !== undefined) partial.kids = filters.kids;
  if (filters.rooms !== undefined) partial.rooms = filters.rooms;
  if (filters.minPrice !== undefined) partial.minPrice = filters.minPrice;
  if (filters.maxPrice !== undefined) partial.maxPrice = filters.maxPrice;
  if (filters.starRatings !== undefined) partial.starRatings = filters.starRatings;
  if (filters.minGuestRating !== undefined) partial.minGuestRating = filters.minGuestRating;
  if (filters.amenities !== undefined) partial.amenities = filters.amenities;
  if (filters.roomFeatures !== undefined) partial.roomFeatures = filters.roomFeatures;
  if (filters.mealPlans !== undefined) partial.mealPlans = filters.mealPlans;
  if (filters.freeCancellationOnly !== undefined) {
    partial.freeCancellationOnly = filters.freeCancellationOnly;
  }
  if (filters.sort !== undefined) partial.sort = filters.sort;

  return partial;
}

export function describeExtraction(
  filters: ExtractedSearchFilters,
  catalogs: SearchCatalogs,
): string[] {
  const labels: string[] = [];

  if (filters.destination) labels.push(filters.destination);
  if (filters.near) labels.push(`Near ${filters.near}`);
  if (filters.checkIn && filters.checkOut) labels.push(`${filters.checkIn} → ${filters.checkOut}`);
  if (filters.adults !== undefined) labels.push(`${filters.adults} adults`);
  if (filters.kids) labels.push(`${filters.kids} kids`);
  if (filters.rooms !== undefined) labels.push(`${filters.rooms} rooms`);
  if (filters.minPrice !== undefined) labels.push(`over $${filters.minPrice}`);
  if (filters.maxPrice !== undefined) labels.push(`under $${filters.maxPrice}`);

  for (const stars of filters.starRatings ?? []) {
    labels.push(`${stars} star${stars > 1 ? "s" : ""}`);
  }
  if (filters.minGuestRating !== undefined) labels.push(`${filters.minGuestRating}+ guest rating`);

  labels.push(...namesOf(filters.amenities ?? [], catalogs.amenities));
  labels.push(...namesOf(filters.roomFeatures ?? [], catalogs.roomFeatures));
  labels.push(...namesOf(filters.mealPlans ?? [], catalogs.mealPlans));

  if (filters.freeCancellationOnly) labels.push("Free cancellation");

  return labels;
}
