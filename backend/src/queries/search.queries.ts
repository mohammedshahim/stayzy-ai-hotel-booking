import { and, eq, gt, gte, ilike, inArray, isNull, lt, or, sql } from "drizzle-orm";
import { db } from "../config/db";
import { amenities, hotelAmenities, hotelImages, hotels } from "../models/hotel.schema";
import { rateOverrides, roomTypeFeatures, roomTypes } from "../models/room-type.schema";
import { bookings } from "../models/booking.schema";

export interface SearchAnchorPoint {
  latitude: number;
  longitude: number;
  radiusKm: number;
}

export interface HotelSearchFilters {
  destination: string;
  starRatings: number[];
  minGuestRating: number | null;
  amenityIds: string[];
  anchor: SearchAnchorPoint | null;
}

export interface CandidateHotel {
  id: string;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  starRating: number;
  averageRating: number;
  reviewCount: number;
  freeCancellation: boolean;
  mainImageUrl: string | null;
  amenities: string[];
  distanceKm: number | null;
}

export async function findCandidateHotels(filters: HotelSearchFilters): Promise<CandidateHotel[]> {
  const destination = filters.destination.trim();
  const destinationPattern = `%${destination}%`;
  const { anchor } = filters;
  const anchorPoint = anchor
    ? sql`ST_SetSRID(ST_MakePoint(${anchor.longitude}, ${anchor.latitude}), 4326)::geography`
    : null;

  return db
    .select({
      id: hotels.id,
      name: hotels.name,
      city: hotels.city,
      country: hotels.country,
      latitude: sql<number>`ST_Y(${hotels.location}::geometry)`,
      longitude: sql<number>`ST_X(${hotels.location}::geometry)`,
      starRating: hotels.starRating,
      averageRating: hotels.averageRating,
      reviewCount: hotels.reviewCount,
      freeCancellation: hotels.freeCancellation,
      // "hotels"."id" hardcoded rather than interpolated — raw sql renders an interpolated column as its bare unqualified name (library-docs.md's PostGIS/Drizzle gotcha).
      mainImageUrl: sql<
        string | null
      >`(SELECT url FROM ${hotelImages} WHERE ${hotelImages.hotelId} = "hotels"."id" AND ${hotelImages.isMain} = true LIMIT 1)`,
      amenities: sql<
        string[]
      >`(SELECT COALESCE(array_agg(a.name ORDER BY a.name), ARRAY[]::text[]) FROM ${hotelAmenities} ha JOIN ${amenities} a ON a.id = ha.amenity_id WHERE ha.hotel_id = "hotels"."id")`,
      distanceKm: anchorPoint
        ? sql<number | null>`ST_Distance(${hotels.location}, ${anchorPoint}) / 1000`
        : sql<number | null>`NULL`,
    })
    .from(hotels)
    .where(
      and(
        isNull(hotels.deletedAt),
        eq(hotels.status, "published"),
        destination
          ? or(
              ilike(hotels.city, destinationPattern),
              ilike(hotels.country, destinationPattern),
              // Matched explicitly since city/country alone never substring-match the "City, Country" form used by search suggestions (see /review, Feature 10 bug).
              ilike(sql`${hotels.city} || ', ' || ${hotels.country}`, destinationPattern),
            )
          : undefined,
        anchorPoint && anchor ? sql`ST_DWithin(${hotels.location}, ${anchorPoint}, ${anchor.radiusKm * 1000})` : undefined,
        filters.starRatings.length > 0 ? inArray(hotels.starRating, filters.starRatings) : undefined,
        filters.minGuestRating !== null ? gte(hotels.averageRating, filters.minGuestRating) : undefined,
        filters.amenityIds.length > 0
          ? sql`(SELECT COUNT(DISTINCT amenity_id) FROM ${hotelAmenities} WHERE hotel_id = "hotels"."id" AND amenity_id IN ${filters.amenityIds}) = ${filters.amenityIds.length}`
          : undefined,
      ),
    );
}

export interface RoomTypeSearchFilters {
  hotelIds: string[];
  adults: number;
  kids: number;
  mealPlanIds: string[];
  roomFeatureIds: string[];
}

export interface CandidateRoomType {
  id: string;
  hotelId: string;
  name: string;
  basePrice: number;
  totalInventory: number;
  freeCancellation: boolean | null;
  mealPlanId: string | null;
  roomFeatureIds: string[];
}

export async function findCandidateRoomTypes(filters: RoomTypeSearchFilters): Promise<CandidateRoomType[]> {
  if (filters.hotelIds.length === 0) return [];

  return db
    .select({
      id: roomTypes.id,
      hotelId: roomTypes.hotelId,
      name: roomTypes.name,
      basePrice: roomTypes.basePrice,
      totalInventory: roomTypes.totalInventory,
      freeCancellation: roomTypes.freeCancellation,
      mealPlanId: roomTypes.mealPlanId,
      roomFeatureIds: sql<
        string[]
      >`(SELECT COALESCE(array_agg(room_feature_id), ARRAY[]::uuid[]) FROM ${roomTypeFeatures} WHERE room_type_id = "room_types"."id")`,
    })
    .from(roomTypes)
    .where(
      and(
        isNull(roomTypes.deletedAt),
        inArray(roomTypes.hotelId, filters.hotelIds),
        gte(roomTypes.maxAdults, filters.adults),
        gte(roomTypes.maxKids, filters.kids),
        filters.mealPlanIds.length > 0 ? inArray(roomTypes.mealPlanId, filters.mealPlanIds) : undefined,
        filters.roomFeatureIds.length > 0
          ? sql`(SELECT COUNT(DISTINCT room_feature_id) FROM ${roomTypeFeatures} WHERE room_type_id = "room_types"."id" AND room_feature_id IN ${filters.roomFeatureIds}) = ${filters.roomFeatureIds.length}`
          : undefined,
      ),
    );
}

// Lets queries run inside booking.service.ts's insert transaction (`tx`) instead of only against the top-level `db` pool.
type TransactionHandle = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type QueryExecutor = typeof db | TransactionHandle;

export interface RateOverrideRow {
  roomTypeId: string;
  date: string;
  price: number | null;
  availableOverride: number | null;
}

export async function findRateOverridesForRoomTypes(
  roomTypeIds: string[],
  dates: string[],
  executor: QueryExecutor = db,
): Promise<RateOverrideRow[]> {
  if (roomTypeIds.length === 0 || dates.length === 0) return [];

  return executor
    .select({
      roomTypeId: rateOverrides.roomTypeId,
      date: rateOverrides.date,
      price: rateOverrides.price,
      availableOverride: rateOverrides.availableOverride,
    })
    .from(rateOverrides)
    .where(and(inArray(rateOverrides.roomTypeId, roomTypeIds), inArray(rateOverrides.date, dates)));
}

export interface OverlappingBookingRow {
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  roomsBooked: number;
}

// checkOut is exclusive (same convention as enumerateStayDates): ranges overlap when existing.check_in < requested.checkOut AND existing.check_out > requested.checkIn.
export async function findOverlappingBookings(
  roomTypeIds: string[],
  checkIn: string,
  checkOut: string,
  heldStatuses: string[],
  executor: QueryExecutor = db,
): Promise<OverlappingBookingRow[]> {
  if (roomTypeIds.length === 0) return [];

  return executor
    .select({
      roomTypeId: bookings.roomTypeId,
      checkIn: bookings.checkIn,
      checkOut: bookings.checkOut,
      roomsBooked: bookings.roomsBooked,
    })
    .from(bookings)
    .where(
      and(
        inArray(bookings.roomTypeId, roomTypeIds),
        inArray(bookings.status, heldStatuses),
        lt(bookings.checkIn, checkOut),
        gt(bookings.checkOut, checkIn),
      ),
    );
}
