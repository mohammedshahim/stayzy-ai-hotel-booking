import { db } from "../config/db";
import {
  cancelConfirmedBookingForOwner,
  completePastConfirmedBookings,
  expireStalePendingBookings,
  findBookingSummaryByIdForOwner,
  findBookingsForOwner,
  insertBooking,
  lockRoomTypeForBooking,
} from "../queries/booking.queries";
import type { BookingSummaryRow } from "../queries/booking.queries";
import { env } from "../config/env";
import { findOverlappingBookings, findRateOverridesForRoomTypes } from "../queries/search.queries";
import { enumerateStayDates, HELD_BOOKING_STATUSES, resolveRoomTypeAvailability } from "./availability.service";
import type { Booking } from "../models/booking.schema";
import type { CreateBookingInput } from "../types/booking.schemas";

// Tagged 400 so errorHandler.ts's `err.status ?? 500` doesn't log routine caller-fault failures (sold out, bad room type) as server errors.
function badRequest(message: string): Error {
  return Object.assign(new Error(message), { status: 400 });
}

export async function createBookingForUser(userId: string, input: CreateBookingInput): Promise<Booking> {
  const stayDates = enumerateStayDates(input.checkIn, input.checkOut);

  return db.transaction(async (tx) => {
    const roomType = await lockRoomTypeForBooking(tx, input.roomTypeId);
    if (!roomType || roomType.deletedAt) {
      throw badRequest("Room type not found");
    }
    if (roomType.hotelId !== input.hotelId) {
      throw badRequest("Room type does not belong to the specified hotel");
    }
    if (roomType.maxAdults < input.adults || roomType.maxKids < input.kids) {
      throw badRequest("This room type doesn't fit the requested party size");
    }

    const [overrides, overlappingBookings] = await Promise.all([
      findRateOverridesForRoomTypes([roomType.id], stayDates, tx),
      findOverlappingBookings([roomType.id], input.checkIn, input.checkOut, HELD_BOOKING_STATUSES, tx),
    ]);
    const availability = resolveRoomTypeAvailability([roomType], stayDates, overrides, overlappingBookings).get(roomType.id);
    if (!availability || availability.remainingInventory < input.rooms) {
      throw badRequest("Not enough rooms available for the selected dates");
    }

    const totalPrice = Math.round(availability.avgNightlyPrice * stayDates.length * input.rooms);

    return insertBooking(tx, {
      userId,
      hotelId: input.hotelId,
      roomTypeId: input.roomTypeId,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      adults: input.adults,
      kids: input.kids,
      roomsBooked: input.rooms,
      totalPrice,
      status: "pending_payment",
    });
  });
}

// Public-facing shape: raw free-cancellation booleans are collapsed into one isCancellable flag, and the reviewId/reviewRating columns
// into one review object, so the client never has to duplicate this eligibility/existence logic itself.
export type BookingSummary = Omit<
  BookingSummaryRow,
  "roomTypeFreeCancellation" | "hotelFreeCancellation" | "reviewId" | "reviewRating"
> & {
  isCancellable: boolean;
  review: { id: string; rating: number } | null;
};

function toBookingSummary(row: BookingSummaryRow): BookingSummary {
  const { roomTypeFreeCancellation, hotelFreeCancellation, reviewId, reviewRating, ...rest } = row;
  const freeCancellation = roomTypeFreeCancellation ?? hotelFreeCancellation;
  return {
    ...rest,
    isCancellable: rest.status === "confirmed" && freeCancellation,
    review: reviewId && reviewRating !== null ? { id: reviewId, rating: reviewRating } : null,
  };
}

export async function getBookingSummaryForOwner(id: string, userId: string): Promise<BookingSummary | null> {
  const row = await findBookingSummaryByIdForOwner(id, userId);
  return row ? toBookingSummary(row) : null;
}

export async function listBookingsForOwner(userId: string): Promise<BookingSummary[]> {
  const rows = await findBookingsForOwner(userId);
  return rows.map(toBookingSummary);
}

export async function cancelBookingForUser(id: string, userId: string): Promise<Booking | null> {
  const row = await findBookingSummaryByIdForOwner(id, userId);
  if (!row) return null;

  if (row.status !== "confirmed") {
    throw badRequest("Only confirmed bookings can be cancelled");
  }
  const freeCancellation = row.roomTypeFreeCancellation ?? row.hotelFreeCancellation;
  if (!freeCancellation) {
    throw badRequest("This booking is non-refundable and can't be cancelled online");
  }

  const cancelled = await cancelConfirmedBookingForOwner(id, userId);
  if (!cancelled) {
    throw badRequest("Booking could not be cancelled");
  }
  return cancelled;
}

export async function expireStaleBookings(): Promise<Booking[]> {
  return expireStalePendingBookings(env.BOOKING_EXPIRY_MINUTES);
}

export async function completePastBookings(): Promise<Booking[]> {
  return completePastConfirmedBookings();
}
