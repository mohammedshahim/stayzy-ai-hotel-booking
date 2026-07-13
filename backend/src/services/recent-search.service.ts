import {
  findDestinationMatchesForOwner,
  findMostRecentForOwner,
  findPlaceSuggestions,
  findRecentRowsForOwner,
  insertRecentSearch,
  mergeGuestRecentSearches as mergeGuestRecentSearchesQuery,
} from "../queries/recent-searches.queries";
import type { RecentSearchInput } from "../queries/recent-searches.queries";
import type { Owner } from "../utils/resolveOwner";

const HOMEPAGE_LIMIT = 5;
const RECENT_SUGGESTION_LIMIT = 3;
const PLACE_SUGGESTION_LIMIT = 5;
const OVERFETCH_MULTIPLIER = 6;

export interface RecentSearchSummary {
  destinationQuery: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  kids: number;
  rooms: number;
  searchedAt: string;
}

export interface SearchSuggestion {
  label: string;
  type: "recent" | "place";
}

function tupleKey(row: {
  destinationQuery: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  kids: number;
  rooms: number;
}): string {
  return `${row.destinationQuery.toLowerCase()}|${row.checkIn}|${row.checkOut}|${row.adults}|${row.kids}|${row.rooms}`;
}

// Best-effort: a failure to record a search must never fail the search response it rides along with, so errors are logged and swallowed rather than propagated.
export async function recordSearchIfChanged(owner: Owner, input: RecentSearchInput): Promise<void> {
  if (!input.destinationQuery.trim()) return;

  try {
    const mostRecent = await findMostRecentForOwner(owner);
    if (mostRecent && tupleKey(mostRecent) === tupleKey(input)) return;
    await insertRecentSearch(owner, input);
  } catch (error) {
    console.error("[recent-search.service/recordSearchIfChanged]", error);
  }
}

export async function listRecentSearches(owner: Owner): Promise<RecentSearchSummary[]> {
  const rows = await findRecentRowsForOwner(owner, HOMEPAGE_LIMIT * OVERFETCH_MULTIPLIER);

  const seen = new Set<string>();
  const summaries: RecentSearchSummary[] = [];
  for (const row of rows) {
    const key = tupleKey(row);
    if (seen.has(key)) continue;
    seen.add(key);
    summaries.push({
      destinationQuery: row.destinationQuery,
      checkIn: row.checkIn,
      checkOut: row.checkOut,
      adults: row.adults,
      kids: row.kids,
      rooms: row.rooms,
      searchedAt: row.searchedAt,
    });
    if (summaries.length === HOMEPAGE_LIMIT) break;
  }
  return summaries;
}

export async function buildSuggestions(owner: Owner, query: string): Promise<SearchSuggestion[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const [recentRows, places] = await Promise.all([
    findDestinationMatchesForOwner(owner, trimmed, RECENT_SUGGESTION_LIMIT * OVERFETCH_MULTIPLIER),
    findPlaceSuggestions(trimmed, PLACE_SUGGESTION_LIMIT),
  ]);

  const suggestions: SearchSuggestion[] = [];
  const seenLabels = new Set<string>();

  for (const row of recentRows) {
    const label = row.destinationQuery;
    const key = label.toLowerCase();
    if (seenLabels.has(key)) continue;
    seenLabels.add(key);
    suggestions.push({ label, type: "recent" });
    if (suggestions.filter((s) => s.type === "recent").length === RECENT_SUGGESTION_LIMIT) break;
  }

  for (const place of places) {
    const label = `${place.city}, ${place.country}`;
    const key = label.toLowerCase();
    if (seenLabels.has(key)) continue;
    seenLabels.add(key);
    suggestions.push({ label, type: "place" });
  }

  return suggestions;
}

export async function mergeGuestRecentSearches(sessionToken: string, userId: string): Promise<void> {
  await mergeGuestRecentSearchesQuery(sessionToken, userId);
}
