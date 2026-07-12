import { and, asc, count, desc, eq, ilike, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { db } from "../config/db";
import { amenities, hotelAmenities, hotelImages, hotels } from "../models/hotel.schema";
import { roomTypes } from "../models/room-type.schema";
import type { Amenity, Hotel, HotelInput, HotelListItem, HotelStatus, SimilarHotel } from "../models/hotel.schema";

const HOTEL_COLUMNS = {
  id: hotels.id,
  name: hotels.name,
  slug: hotels.slug,
  description: hotels.description,
  addressLine1: hotels.addressLine1,
  addressLine2: hotels.addressLine2,
  city: hotels.city,
  state: hotels.state,
  country: hotels.country,
  postalCode: hotels.postalCode,
  latitude: sql<number>`ST_Y(${hotels.location}::geometry)`,
  longitude: sql<number>`ST_X(${hotels.location}::geometry)`,
  starRating: hotels.starRating,
  checkInTime: sql<string>`to_char(${hotels.checkInTime}, 'HH24:MI')`,
  checkOutTime: sql<string>`to_char(${hotels.checkOutTime}, 'HH24:MI')`,
  freeCancellation: hotels.freeCancellation,
  cancellationPolicy: hotels.cancellationPolicy,
  status: sql<HotelStatus>`${hotels.status}`,
  averageRating: hotels.averageRating,
  reviewCount: hotels.reviewCount,
  createdAt: hotels.createdAt,
  updatedAt: hotels.updatedAt,
};

export interface HotelWriteParams extends Omit<HotelInput, "amenityIds"> {
  slug: string;
  latitude: number;
  longitude: number;
}

function writeParamsToRow(params: HotelWriteParams) {
  return {
    name: params.name,
    slug: params.slug,
    description: params.description,
    addressLine1: params.addressLine1,
    addressLine2: params.addressLine2 ?? null,
    city: params.city,
    state: params.state ?? null,
    country: params.country,
    postalCode: params.postalCode ?? null,
    location: { latitude: params.latitude, longitude: params.longitude },
    starRating: params.starRating,
    checkInTime: params.checkInTime,
    checkOutTime: params.checkOutTime,
    freeCancellation: params.freeCancellation,
    cancellationPolicy: params.cancellationPolicy,
    status: params.status,
  };
}

export async function insertHotel(params: HotelWriteParams): Promise<Hotel> {
  const [row] = await db.insert(hotels).values(writeParamsToRow(params)).returning(HOTEL_COLUMNS);
  if (!row) throw new Error("Failed to insert hotel");
  return row;
}

export async function updateHotel(id: string, params: HotelWriteParams): Promise<Hotel | null> {
  const [row] = await db
    .update(hotels)
    .set({ ...writeParamsToRow(params), updatedAt: sql`now()` })
    .where(and(eq(hotels.id, id), isNull(hotels.deletedAt)))
    .returning(HOTEL_COLUMNS);
  return row ?? null;
}

export async function getHotelById(id: string): Promise<Hotel | null> {
  const [row] = await db
    .select(HOTEL_COLUMNS)
    .from(hotels)
    .where(and(eq(hotels.id, id), isNull(hotels.deletedAt)));
  return row ?? null;
}

export interface ListHotelsParams {
  page: number;
  pageSize: number;
}

export interface ListHotelsResult {
  items: HotelListItem[];
  total: number;
}

export async function listHotels({ page, pageSize }: ListHotelsParams): Promise<ListHotelsResult> {
  const offset = (page - 1) * pageSize;
  const items = await db
    .select({
      id: hotels.id,
      name: hotels.name,
      city: hotels.city,
      country: hotels.country,
      starRating: hotels.starRating,
      status: sql<HotelStatus>`${hotels.status}`,
      createdAt: hotels.createdAt,
      // "hotels"."id" is hardcoded (not hotels.id interpolated) — a raw sql template
      // renders an interpolated column as its bare, unqualified name, and hotel_images
      // has its own "id" column that would otherwise silently shadow the outer table's.
      mainImageUrl: sql<
        string | null
      >`(SELECT url FROM ${hotelImages} WHERE ${hotelImages.hotelId} = "hotels"."id" AND ${hotelImages.isMain} = true LIMIT 1)`,
    })
    .from(hotels)
    .where(isNull(hotels.deletedAt))
    .orderBy(desc(hotels.createdAt))
    .limit(pageSize)
    .offset(offset);

  const [totalRow] = await db.select({ count: count() }).from(hotels).where(isNull(hotels.deletedAt));
  return { items, total: totalRow?.count ?? 0 };
}

export async function softDeleteHotel(id: string): Promise<boolean> {
  const result = await db
    .update(hotels)
    .set({ deletedAt: sql`now()` })
    .where(and(eq(hotels.id, id), isNull(hotels.deletedAt)));
  return (result.rowCount ?? 0) > 0;
}

export async function isSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  const condition = excludeId ? and(eq(hotels.slug, slug), ne(hotels.id, excludeId)) : eq(hotels.slug, slug);
  const [row] = await db
    .select({ id: hotels.id })
    .from(hotels)
    .where(condition)
    .limit(1);
  return row !== undefined;
}

export interface FindSimilarHotelsParams {
  excludeId: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

const SIMILAR_HOTELS_LIMIT = 6;

export async function findSimilarHotels(params: FindSimilarHotelsParams): Promise<SimilarHotel[]> {
  const referencePoint = sql`ST_SetSRID(ST_MakePoint(${params.longitude}, ${params.latitude}), 4326)::geography`;
  return db
    .select({
      id: hotels.id,
      name: hotels.name,
      city: hotels.city,
      country: hotels.country,
      starRating: hotels.starRating,
      averageRating: hotels.averageRating,
      reviewCount: hotels.reviewCount,
      // "hotels"."id" hardcoded — see listHotels' mainImageUrl for why.
      mainImageUrl: sql<
        string | null
      >`(SELECT url FROM ${hotelImages} WHERE ${hotelImages.hotelId} = "hotels"."id" AND ${hotelImages.isMain} = true LIMIT 1)`,
    })
    .from(hotels)
    .where(
      and(
        eq(hotels.city, params.city),
        eq(hotels.country, params.country),
        ne(hotels.id, params.excludeId),
        eq(hotels.status, "published"),
        isNull(hotels.deletedAt),
      ),
    )
    .orderBy(sql`ST_Distance(${hotels.location}, ${referencePoint})`)
    .limit(SIMILAR_HOTELS_LIMIT);
}

export async function getHotelAmenities(hotelId: string): Promise<Amenity[]> {
  return db
    .select({ id: amenities.id, name: amenities.name, icon: amenities.icon })
    .from(amenities)
    .innerJoin(hotelAmenities, eq(hotelAmenities.amenityId, amenities.id))
    .where(eq(hotelAmenities.hotelId, hotelId))
    .orderBy(asc(amenities.name));
}

export async function setHotelAmenities(hotelId: string, amenityIds: string[]): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(hotelAmenities).where(eq(hotelAmenities.hotelId, hotelId));
    if (amenityIds.length > 0) {
      await tx.insert(hotelAmenities).values(amenityIds.map((amenityId) => ({ hotelId, amenityId })));
    }
  });
}

export interface CompareHotelRow {
  id: string;
  name: string;
  city: string;
  country: string;
  starRating: number;
  averageRating: number;
  reviewCount: number;
  mainImageUrl: string | null;
  fromPrice: number | null;
  cancellationPolicy: string;
  freeCancellation: boolean;
  amenities: string[];
}

// Order is not guaranteed by `IN` — callers re-sort the result to match the
// requested id order (see hotel.service.ts's getHotelsForCompare) so the compare
// table's columns don't reshuffle themselves on every fetch.
export async function findHotelsForCompare(ids: string[]): Promise<CompareHotelRow[]> {
  if (ids.length === 0) return [];

  return db
    .select({
      id: hotels.id,
      name: hotels.name,
      city: hotels.city,
      country: hotels.country,
      starRating: hotels.starRating,
      averageRating: hotels.averageRating,
      reviewCount: hotels.reviewCount,
      // "hotels"."id" hardcoded in every subquery below — see listHotels' mainImageUrl
      // for why a raw sql fragment needs the qualified, unquoted-alias form.
      mainImageUrl: sql<
        string | null
      >`(SELECT url FROM ${hotelImages} WHERE ${hotelImages.hotelId} = "hotels"."id" AND ${hotelImages.isMain} = true LIMIT 1)`,
      fromPrice: sql<
        number | null
      >`(SELECT MIN(${roomTypes.basePrice})::float8 FROM ${roomTypes} WHERE ${roomTypes.hotelId} = "hotels"."id" AND ${roomTypes.deletedAt} IS NULL)`,
      cancellationPolicy: hotels.cancellationPolicy,
      freeCancellation: hotels.freeCancellation,
      amenities: sql<
        string[]
      >`(SELECT COALESCE(array_agg(a.name ORDER BY a.name), ARRAY[]::text[]) FROM ${hotelAmenities} ha JOIN ${amenities} a ON a.id = ha.amenity_id WHERE ha.hotel_id = "hotels"."id")`,
    })
    .from(hotels)
    .where(and(inArray(hotels.id, ids), eq(hotels.status, "published"), isNull(hotels.deletedAt)));
}

export interface HotelSearchSuggestion {
  id: string;
  name: string;
  city: string;
  country: string;
  mainImageUrl: string | null;
}

const HOTEL_SEARCH_SUGGESTIONS_LIMIT = 8;

export async function findHotelSearchSuggestions(query: string, excludeIds: string[]): Promise<HotelSearchSuggestion[]> {
  const pattern = `%${query}%`;
  return db
    .select({
      id: hotels.id,
      name: hotels.name,
      city: hotels.city,
      country: hotels.country,
      // "hotels"."id" hardcoded — see findHotelsForCompare above for why.
      mainImageUrl: sql<
        string | null
      >`(SELECT url FROM ${hotelImages} WHERE ${hotelImages.hotelId} = "hotels"."id" AND ${hotelImages.isMain} = true LIMIT 1)`,
    })
    .from(hotels)
    .where(
      and(
        eq(hotels.status, "published"),
        isNull(hotels.deletedAt),
        or(ilike(hotels.name, pattern), ilike(hotels.city, pattern), ilike(hotels.country, pattern)),
        excludeIds.length > 0 ? sql`${hotels.id} NOT IN ${excludeIds}` : undefined,
      ),
    )
    .orderBy(asc(hotels.name))
    .limit(HOTEL_SEARCH_SUGGESTIONS_LIMIT);
}
