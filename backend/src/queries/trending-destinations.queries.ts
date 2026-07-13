import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "../config/db";
import { hotelImages, hotels } from "../models/hotel.schema";

export interface CityHotelCount {
  city: string;
  country: string;
  hotelCount: number;
}

export async function findTopCitiesByHotelCount(limit: number): Promise<CityHotelCount[]> {
  return db
    .select({
      city: hotels.city,
      country: hotels.country,
      hotelCount: sql<number>`count(*)::int`,
    })
    .from(hotels)
    .where(and(isNull(hotels.deletedAt), eq(hotels.status, "published")))
    .groupBy(hotels.city, hotels.country)
    .orderBy(sql`count(*) desc`, sql`avg(${hotels.averageRating}) desc`)
    .limit(limit);
}

// One small query per city (counts capped low by findTopCitiesByHotelCount's limit) rather than a correlated subquery, to avoid grouped-column aliasing pitfalls.
export async function findTopHotelImageForCity(city: string, country: string): Promise<string | null> {
  const [row] = await db
    .select({
      // "hotels"."id" hardcoded — see hotels.queries.ts's listHotels mainImageUrl subquery.
      mainImageUrl: sql<
        string | null
      >`(SELECT url FROM ${hotelImages} WHERE ${hotelImages.hotelId} = "hotels"."id" AND ${hotelImages.isMain} = true LIMIT 1)`,
    })
    .from(hotels)
    .where(and(isNull(hotels.deletedAt), eq(hotels.status, "published"), eq(hotels.city, city), eq(hotels.country, country)))
    .orderBy(desc(hotels.averageRating))
    .limit(1);

  return row?.mainImageUrl ?? null;
}
