import { and, eq, gt, inArray, isNull, lt, sql } from "drizzle-orm";
import { db } from "../config/db";
import { bookings } from "../models/booking.schema";
import { hotels } from "../models/hotel.schema";
import { roomTypes } from "../models/room-type.schema";

export interface DashboardBookingStats {
  totalBookings: number;
  cancelledCount: number;
  revenue: number;
  bookedRoomNights: number;
}

// Single-pass aggregate over bookings whose stay overlaps [rangeStart, rangeEndExclusive).
// bookedRoomNights clips each held-status booking's stay to the range (LEAST/GREATEST) rather than counting whole bookings,
// so a booking that only partially overlaps the range only contributes the nights actually inside it.
export async function findDashboardBookingStats(rangeStart: string, rangeEndExclusive: string): Promise<DashboardBookingStats> {
  const [row] = await db
    .select({
      totalBookings: sql<number>`count(*)::int`,
      cancelledCount: sql<number>`count(*) filter (where ${bookings.status} = 'cancelled')::int`,
      revenue: sql<number>`coalesce(sum(${bookings.totalPrice}) filter (where ${bookings.status} in ('confirmed', 'completed')), 0)::int`,
      bookedRoomNights: sql<number>`coalesce(sum(
        (least(${bookings.checkOut}, ${rangeEndExclusive}::date) - greatest(${bookings.checkIn}, ${rangeStart}::date)) * ${bookings.roomsBooked}
      ) filter (where ${bookings.status} in ('pending_payment', 'confirmed', 'completed')), 0)::int`,
    })
    .from(bookings)
    .where(and(lt(bookings.checkIn, rangeEndExclusive), gt(bookings.checkOut, rangeStart)));

  return row ?? { totalBookings: 0, cancelledCount: 0, revenue: 0, bookedRoomNights: 0 };
}

// Denominator side of occupancy rate — only published hotels' live room types count as bookable inventory.
export async function findPublishedRoomInventoryTotal(): Promise<number> {
  const [row] = await db
    .select({ totalInventory: sql<number>`coalesce(sum(${roomTypes.totalInventory}), 0)::int` })
    .from(roomTypes)
    .innerJoin(hotels, eq(hotels.id, roomTypes.hotelId))
    .where(and(isNull(roomTypes.deletedAt), isNull(hotels.deletedAt), eq(hotels.status, "published")));

  return row?.totalInventory ?? 0;
}

export interface TopHotelRow {
  hotelId: string;
  hotelName: string;
  bookingCount: number;
  revenue: number;
}

export async function findTopHotelsByBookingCount(
  rangeStart: string,
  rangeEndExclusive: string,
  limit: number,
): Promise<TopHotelRow[]> {
  return db
    .select({
      hotelId: bookings.hotelId,
      hotelName: hotels.name,
      bookingCount: sql<number>`count(*)::int`,
      revenue: sql<number>`coalesce(sum(${bookings.totalPrice}), 0)::int`,
    })
    .from(bookings)
    .innerJoin(hotels, eq(hotels.id, bookings.hotelId))
    .where(
      and(
        inArray(bookings.status, ["confirmed", "completed"]),
        lt(bookings.checkIn, rangeEndExclusive),
        gt(bookings.checkOut, rangeStart),
      ),
    )
    .groupBy(bookings.hotelId, hotels.name)
    .orderBy(sql`count(*) desc`)
    .limit(limit);
}
