import { toSearchState } from "@/features/search/lib/extraction";
import { DEFAULT_STATE, serializeSearchState } from "@/features/search/hooks/useSearchState";
import type { SearchCatalogs } from "@/features/search/hooks/useSearchCatalogs";
import type { CatalogOption } from "@/features/search/types";
import type { ChatChipFilters } from "@/features/chat/types";

function idsOf(names: string[] | undefined, options: CatalogOption[]): string[] | undefined {
  if (!names?.length) return undefined;

  const idByName = new Map(options.map((option) => [option.name.toLowerCase(), option.id]));
  const ids = names
    .map((name) => idByName.get(name.toLowerCase()))
    .filter((id): id is string => Boolean(id));

  return ids.length ? ids : undefined;
}

// An unknown name is dropped, not passed through: GET /search validates these as uuids and 400s.
export function chipToSearchHref(filters: ChatChipFilters, catalogs: SearchCatalogs): string {
  const resolved = {
    ...filters,
    amenities: idsOf(filters.amenities, catalogs.amenities),
    roomFeatures: idsOf(filters.roomFeatures, catalogs.roomFeatures),
    mealPlans: idsOf(filters.mealPlans, catalogs.mealPlans),
  };

  const query = serializeSearchState({ ...DEFAULT_STATE, ...toSearchState(resolved) });
  return query ? `/search?${query}` : "/search";
}
