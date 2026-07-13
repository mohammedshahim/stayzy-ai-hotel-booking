import { and, eq, lt } from "drizzle-orm";
import { db } from "../config/db";
import { bookings } from "../models/booking.schema";
import type { Booking, BookingInput } from "../models/booking.schema";
import { hotelImages, hotels } from "../models/hotel.schema";
import { roomTypes } from "../models/room-type.schema";
import type { QueryExecutor } from "./search.queries";

export interface LockedRoomType {
  id: string;
  hotelId: string;
  basePrice: number;
  totalInventory: number;
  maxAdults: number;
  maxKids: number;
  deletedAt: string | null;
}

// Locks the row for the transaction's lifetime so a concurrent booking on the same room type blocks instead of racing off stale availability.
export async function lockRoomTypeForBooking(tx: QueryExecutor, roomTypeId: string): Promise<LockedRoomType | null> {
  const [row] = await tx
    .select({
      id: roomTypes.id,
      hotelId: roomTypes.hotelId,
      basePrice: roomTypes.basePrice,
      totalInventory: roomTypes.totalInventory,
      maxAdults: roomTypes.maxAdults,
      maxKids: roomTypes.maxKids,
      deletedAt: roomTypes.deletedAt,
    })
    .from(roomTypes)
    .where(eq(roomTypes.id, roomTypeId))
    .for("update");
  return row ?? null;
}

export async function insertBooking(tx: QueryExecutor, data: BookingInput): Promise<Booking> {
  const [row] = await tx.insert(bookings).values(data).returning();
  if (!row) throw new Error("Failed to insert booking");
  return row;
}

export interface BookingSummaryRow extends Booking {
  hotelName: string;
  hotelCity: string;
  hotelCountry: string;
  hotelMainImageUrl: string | null;
  roomTypeName: string;
}

export async function findBookingByIdForOwner(id: string, userId: string): Promise<Booking | null> {
  const [row] = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.id, id), eq(bookings.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function updateBookingStripePaymentIntentId(id: string, stripePaymentIntentId: string): Promise<void> {
  await db.update(bookings).set({ stripePaymentIntentId }).where(eq(bookings.id, id));
}

export async function findBookingByStripePaymentIntentId(stripePaymentIntentId: string): Promise<Booking | null> {
  const [row] = await db.select().from(bookings).where(eq(bookings.stripePaymentIntentId, stripePaymentIntentId)).limit(1);
  return row ?? null;
}

// Conditioned on the current status so a late/duplicate webhook delivery can't clobber a booking a later event (or the expiry sweep) already moved past pending_payment.
async function transitionBookingIfPending(id: string, status: "confirmed" | "failed"): Promise<Booking | null> {
  const [row] = await db
    .update(bookings)
    .set({ status })
    .where(and(eq(bookings.id, id), eq(bookings.status, "pending_payment")))
    .returning();
  return row ?? null;
}

export function confirmBookingIfPending(id: string): Promise<Booking | null> {
  return transitionBookingIfPending(id, "confirmed");
}

export function failBookingIfPending(id: string): Promise<Booking | null> {
  return transitionBookingIfPending(id, "failed");
}

export async function expireStalePendingBookings(cutoffMinutes: number): Promise<Booking[]> {
  const cutoff = new Date(Date.now() - cutoffMinutes * 60_000).toISOString();
  return db
    .update(bookings)
    .set({ status: "cancelled", cancelledAt: new Date().toISOString() })
    .where(and(eq(bookings.status, "pending_payment"), lt(bookings.createdAt, cutoff)))
    .returning();
}

export async function findBookingSummaryByIdForOwner(id: string, userId: string): Promise<BookingSummaryRow | null> {
  const [row] = await db
    .select({
      id: bookings.id,
      userId: bookings.userId,
      hotelId: bookings.hotelId,
      roomTypeId: bookings.roomTypeId,
      checkIn: bookings.checkIn,
      checkOut: bookings.checkOut,
      adults: bookings.adults,
      kids: bookings.kids,
      roomsBooked: bookings.roomsBooked,
      totalPrice: bookings.totalPrice,
      status: bookings.status,
      stripePaymentIntentId: bookings.stripePaymentIntentId,
      cancelledAt: bookings.cancelledAt,
      createdAt: bookings.createdAt,
      updatedAt: bookings.updatedAt,
      hotelName: hotels.name,
      hotelCity: hotels.city,
      hotelCountry: hotels.country,
      hotelMainImageUrl: hotelImages.url,
      roomTypeName: roomTypes.name,
    })
    .from(bookings)
    .innerJoin(hotels, eq(hotels.id, bookings.hotelId))
    .innerJoin(roomTypes, eq(roomTypes.id, bookings.roomTypeId))
    .leftJoin(hotelImages, and(eq(hotelImages.hotelId, hotels.id), eq(hotelImages.isMain, true)))
    .where(and(eq(bookings.id, id), eq(bookings.userId, userId)))
    .limit(1);
  return row ?? null;
}
