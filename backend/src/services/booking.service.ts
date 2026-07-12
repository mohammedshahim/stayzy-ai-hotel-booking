import { db } from "../config/db";
import { findBookingSummaryByIdForOwner, insertBooking, lockRoomTypeForBooking } from "../queries/booking.queries";
import type { BookingSummaryRow } from "../queries/booking.queries";
import { findOverlappingBookings, findRateOverridesForRoomTypes } from "../queries/search.queries";
import { enumerateStayDates, HELD_BOOKING_STATUSES, resolveRoomTypeAvailability } from "./availability.service";
import type { Booking } from "../models/booking.schema";
import type { CreateBookingInput } from "../types/booking.schemas";

// Business-rule failures below are the caller's fault (bad room type, party too big, sold
// out) — tagged 400 so errorHandler.ts's `err.status ?? 500` doesn't log them as server
// errors on every routine "this room just sold out" case.
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

export async function getBookingSummaryForOwner(id: string, userId: string): Promise<BookingSummaryRow | null> {
  return findBookingSummaryByIdForOwner(id, userId);
}
