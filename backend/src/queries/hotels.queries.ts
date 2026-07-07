import { and, asc, count, desc, eq, isNull, ne, sql } from "drizzle-orm";
import { db } from "../config/db";
import { amenities, hotelAmenities, hotelImages, hotels } from "../models/hotel.schema";
import type { Amenity, Hotel, HotelInput, HotelListItem, HotelStatus } from "../models/hotel.schema";

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
