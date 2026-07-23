import { env } from "../config/env";
import { listAmenities } from "../queries/amenities.queries";
import { listMealPlans } from "../queries/meal-plans.queries";
import { listRoomFeatures } from "../queries/room-features.queries";
import { postToAgent } from "./ai.service";
import { SEARCH_SORT_OPTIONS } from "../types/search.schemas";
import {
  agentExtractionSchema,
  type ExtractedSearchFilters,
  type SearchFilterExtraction,
} from "../types/search-extraction.schemas";

interface NamedRow {
  id: string;
  name: string;
}

interface Resolved {
  ids: string[];
  unresolved: string[];
}

function resolveNames(names: string[] | undefined, vocabulary: NamedRow[]): Resolved {
  const idsByName = new Map(vocabulary.map((row) => [row.name.toLowerCase(), row.id]));
  const ids: string[] = [];
  const unresolved: string[] = [];

  for (const name of names ?? []) {
    const id = idsByName.get(name.trim().toLowerCase());
    if (id) ids.push(id);
    else unresolved.push(name);
  }

  return { ids, unresolved };
}

function optional(ids: string[]): string[] | undefined {
  return ids.length > 0 ? ids : undefined;
}

// Both keys are always returned so spreading the result overwrites what the model sent.
function pickDates(filters: ExtractedSearchFilters, today: string) {
  const { checkIn, checkOut } = filters;
  const inPast = (checkIn && checkIn < today) || (checkOut && checkOut < today);
  const reversed = checkIn && checkOut && checkOut <= checkIn;
  if (inPast || reversed) return { checkIn: undefined, checkOut: undefined };
  return { checkIn, checkOut };
}

// "distance" measures from the `near` anchor, so it is the backend's call, never the model's.
function pickSort(filters: ExtractedSearchFilters) {
  if (filters.near) return { sort: "distance" as const };
  return { sort: filters.sort === "distance" ? undefined : filters.sort };
}

function pickPrices(filters: ExtractedSearchFilters) {
  const { minPrice, maxPrice } = filters;
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    return { minPrice: undefined, maxPrice: undefined };
  }
  return { minPrice, maxPrice };
}

export async function extractSearchFilters(
  prompt: string,
  timeoutMs: number = env.AI_REQUEST_TIMEOUT_MS,
): Promise<SearchFilterExtraction | null> {
  const [amenities, roomFeatures, mealPlans] = await Promise.all([
    listAmenities(),
    listRoomFeatures(),
    listMealPlans(),
  ]);

  const today = new Date().toISOString().slice(0, 10);

  const data = await postToAgent<unknown>(
    "/smart-search/extract",
    {
      prompt,
      today,
      amenities: amenities.map((row) => row.name),
      roomFeatures: roomFeatures.map((row) => row.name),
      mealPlans: mealPlans.map((row) => row.name),
      sortOptions: SEARCH_SORT_OPTIONS,
    },
    timeoutMs,
  );
  if (!data) return null;

  const parsed = agentExtractionSchema.safeParse(data);
  if (!parsed.success) {
    console.error("[services/search-extraction] unusable shape", parsed.error.issues[0]?.message);
    return null;
  }

  const { filters, unmapped } = parsed.data;
  const matchedAmenities = resolveNames(filters.amenities, amenities);
  const matchedRoomFeatures = resolveNames(filters.roomFeatures, roomFeatures);
  const matchedMealPlans = resolveNames(filters.mealPlans, mealPlans);

  return {
    filters: {
      ...filters,
      ...pickDates(filters, today),
      ...pickPrices(filters),
      ...pickSort(filters),
      amenities: optional(matchedAmenities.ids),
      roomFeatures: optional(matchedRoomFeatures.ids),
      mealPlans: optional(matchedMealPlans.ids),
    },
    unmapped: [
      ...unmapped,
      ...matchedAmenities.unresolved,
      ...matchedRoomFeatures.unresolved,
      ...matchedMealPlans.unresolved,
    ],
  };
}
