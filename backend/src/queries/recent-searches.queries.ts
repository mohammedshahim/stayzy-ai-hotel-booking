import { and, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { db } from "../config/db";
import { recentSearches } from "../models/favorite.schema";
import type { RecentSearch } from "../models/favorite.schema";
import { hotels } from "../models/hotel.schema";
import type { Owner } from "../utils/resolveOwner";

function ownerCondition(owner: Owner) {
  return owner.kind === "user" ? eq(recentSearches.userId, owner.userId) : eq(recentSearches.sessionToken, owner.sessionToken);
}

export async function findMostRecentForOwner(owner: Owner): Promise<RecentSearch | null> {
  const [row] = await db
    .select()
    .from(recentSearches)
    .where(ownerCondition(owner))
    .orderBy(desc(recentSearches.searchedAt))
    .limit(1);
  return row ?? null;
}

export interface RecentSearchInput {
  destinationQuery: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  kids: number;
  rooms: number;
}

export async function insertRecentSearch(owner: Owner, input: RecentSearchInput): Promise<void> {
  await db.insert(recentSearches).values({
    userId: owner.kind === "user" ? owner.userId : null,
    sessionToken: owner.kind === "guest" ? owner.sessionToken : null,
    destinationQuery: input.destinationQuery,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    adults: input.adults,
    kids: input.kids,
    rooms: input.rooms,
  });
}

// Recent rows for one owner, newest first — capped generously above the display limit so the
// caller can dedupe repeated (destination, dates, guests) combos in JS and still fill the page.
export async function findRecentRowsForOwner(owner: Owner, take: number): Promise<RecentSearch[]> {
  return db
    .select()
    .from(recentSearches)
    .where(ownerCondition(owner))
    .orderBy(desc(recentSearches.searchedAt))
    .limit(take);
}

// Rows are not deduped by destination in SQL — the caller collapses repeated destination
// strings in JS, same as findRecentRowsForOwner, so `take` is a generous over-fetch.
export async function findDestinationMatchesForOwner(owner: Owner, query: string, take: number): Promise<RecentSearch[]> {
  return db
    .select()
    .from(recentSearches)
    .where(and(ownerCondition(owner), ilike(recentSearches.destinationQuery, `%${query}%`)))
    .orderBy(desc(recentSearches.searchedAt))
    .limit(take);
}

export async function mergeGuestRecentSearches(sessionToken: string, userId: string): Promise<void> {
  await db
    .update(recentSearches)
    .set({ userId, sessionToken: null })
    .where(eq(recentSearches.sessionToken, sessionToken));
}

export interface PlaceSuggestion {
  city: string;
  country: string;
}

export async function findPlaceSuggestions(query: string, limit: number): Promise<PlaceSuggestion[]> {
  const pattern = `%${query}%`;
  return db
    .selectDistinct({ city: hotels.city, country: hotels.country })
    .from(hotels)
    .where(
      and(
        isNull(hotels.deletedAt),
        eq(hotels.status, "published"),
        or(ilike(hotels.city, pattern), ilike(hotels.country, pattern)),
      ),
    )
    .orderBy(hotels.city)
    .limit(limit);
}
