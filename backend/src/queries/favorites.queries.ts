import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "../config/db";
import { favorites } from "../models/favorite.schema";
import { hotelImages, hotels } from "../models/hotel.schema";
import { roomTypes } from "../models/room-type.schema";
import type { Owner } from "../utils/resolveOwner";

function ownerCondition(owner: Owner) {
  return owner.kind === "user" ? eq(favorites.userId, owner.userId) : eq(favorites.sessionToken, owner.sessionToken);
}

export async function findFavoriteHotelIds(owner: Owner): Promise<string[]> {
  const rows = await db.select({ hotelId: favorites.hotelId }).from(favorites).where(ownerCondition(owner));
  return rows.map((row) => row.hotelId);
}

export interface FavoriteHotelRow {
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
}

export async function findFavoritesForOwner(owner: Owner): Promise<FavoriteHotelRow[]> {
  return db
    .select({
      id: hotels.id,
      name: hotels.name,
      city: hotels.city,
      country: hotels.country,
      starRating: hotels.starRating,
      averageRating: hotels.averageRating,
      reviewCount: hotels.reviewCount,
      // "hotels"."id" hardcoded in both subqueries — see hotels.queries.ts' listHotels for why (raw sql renders an interpolated column unqualified, which would shadow the outer reference).
      mainImageUrl: sql<
        string | null
      >`(SELECT url FROM ${hotelImages} WHERE ${hotelImages.hotelId} = "hotels"."id" AND ${hotelImages.isMain} = true LIMIT 1)`,
      // ::float8 cast — numeric aggregates come back from the pg driver as strings unless cast to a float/int type.
      fromPrice: sql<
        number | null
      >`(SELECT MIN(${roomTypes.basePrice})::float8 FROM ${roomTypes} WHERE ${roomTypes.hotelId} = "hotels"."id" AND ${roomTypes.deletedAt} IS NULL)`,
      savedAt: favorites.createdAt,
    })
    .from(favorites)
    .innerJoin(hotels, eq(hotels.id, favorites.hotelId))
    .where(and(ownerCondition(owner), isNull(hotels.deletedAt)))
    .orderBy(desc(favorites.createdAt));
}

export async function insertFavorite(owner: Owner, hotelId: string): Promise<void> {
  await db.insert(favorites).values({
    userId: owner.kind === "user" ? owner.userId : null,
    sessionToken: owner.kind === "guest" ? owner.sessionToken : null,
    hotelId,
  });
}

export async function deleteFavorite(owner: Owner, hotelId: string): Promise<boolean> {
  const result = await db
    .delete(favorites)
    .where(and(ownerCondition(owner), eq(favorites.hotelId, hotelId)));
  return (result.rowCount ?? 0) > 0;
}

export async function mergeGuestFavorites(sessionToken: string, userId: string): Promise<void> {
  await db.transaction(async (tx) => {
    // Drop guest rows that would collide with an existing account favorite (unique on user_id, hotel_id) to avoid a unique-violation on the update below.
    await tx.delete(favorites).where(
      and(
        eq(favorites.sessionToken, sessionToken),
        inArray(
          favorites.hotelId,
          tx.select({ hotelId: favorites.hotelId }).from(favorites).where(eq(favorites.userId, userId)),
        ),
      ),
    );

    await tx
      .update(favorites)
      .set({ userId, sessionToken: null })
      .where(eq(favorites.sessionToken, sessionToken));
  });
}
