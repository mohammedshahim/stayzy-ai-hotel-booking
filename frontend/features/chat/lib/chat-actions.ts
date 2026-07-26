import { toSearchState } from "@/features/search/lib/extraction";
import { DEFAULT_STATE, serializeSearchState } from "@/features/search/hooks/useSearchState";
import type { SearchCatalogs } from "@/features/search/hooks/useSearchCatalogs";
import type { CatalogOption } from "@/features/search/types";
import type { ChatAction, ChatChipFilters } from "@/features/chat/types";

export function toAction(event: { type: "action" } & ChatAction): ChatAction {
  if (event.kind === "navigate") {
    return { kind: "navigate", label: event.label, filters: event.filters };
  }
  if (event.kind === "checkout") {
    return { kind: "checkout", label: event.label, path: event.path };
  }
  return {
    kind: event.kind,
    label: event.label,
    hotelId: event.hotelId,
    hotelName: event.hotelName,
  };
}

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
