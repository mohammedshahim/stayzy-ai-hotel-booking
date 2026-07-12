import { findCandidateRoomTypes, findOverlappingBookings, findRateOverridesForRoomTypes } from "../queries/search.queries";
import type { CandidateHotel, OverlappingBookingRow, RateOverrideRow } from "../queries/search.queries";

// Statuses that still occupy inventory. cancelled/failed bookings release their hold —
// cancelled immediately, failed because the payment never went through in the first place.
export const HELD_BOOKING_STATUSES = ["pending_payment", "confirmed", "completed"];

export interface QualifyingRoomType {
  roomTypeId: string;
  hotelId: string;
  name: string;
  mealPlanId: string | null;
  roomFeatureIds: string[];
  freeCancellation: boolean;
  avgNightlyPrice: number;
}

export interface FindQualifyingRoomTypesParams {
  hotelsById: Map<string, CandidateHotel>;
  checkIn: string;
  checkOut: string;
  adults: number;
  kids: number;
  rooms: number;
  mealPlanIds: string[];
  roomFeatureIds: string[];
  freeCancellationOnly: boolean;
}

// checkOut is the checkout date (exclusive) — a stay from 2026-07-10 to 2026-07-12 covers
// 2 nights: 2026-07-10 and 2026-07-11.
export function enumerateStayDates(checkIn: string, checkOut: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${checkIn}T00:00:00Z`);
  const end = new Date(`${checkOut}T00:00:00Z`);
  while (cursor < end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

// Expands each overlapping booking across its own night list and sums roomsBooked per
// (roomTypeId, date), restricted to the dates actually being checked — a booking can span
// nights outside the requested range, those are irrelevant here.
function buildBookedCountsByRoomType(
  overlappingBookings: OverlappingBookingRow[],
  stayDates: string[],
): Map<string, Map<string, number>> {
  const relevantDates = new Set(stayDates);
  const bookedByRoomType = new Map<string, Map<string, number>>();

  for (const booking of overlappingBookings) {
    let bookedByDate = bookedByRoomType.get(booking.roomTypeId);
    if (!bookedByDate) {
      bookedByDate = new Map();
      bookedByRoomType.set(booking.roomTypeId, bookedByDate);
    }
    for (const date of enumerateStayDates(booking.checkIn, booking.checkOut)) {
      if (!relevantDates.has(date)) continue;
      bookedByDate.set(date, (bookedByDate.get(date) ?? 0) + booking.roomsBooked);
    }
  }
  return bookedByRoomType;
}

// No booking-overlap subtraction here — the `bookings` table doesn't exist until Phase 5,
// so availability for now reduces to inventory minus rate-override closures only.
export async function findQualifyingRoomTypes(params: FindQualifyingRoomTypesParams): Promise<QualifyingRoomType[]> {
  const hotelIds = Array.from(params.hotelsById.keys());
  const roomTypeCandidates = await findCandidateRoomTypes({
    hotelIds,
    adults: params.adults,
    kids: params.kids,
    mealPlanIds: params.mealPlanIds,
    roomFeatureIds: params.roomFeatureIds,
  });
  if (roomTypeCandidates.length === 0) return [];

  const stayDates = enumerateStayDates(params.checkIn, params.checkOut);
  // A zero-or-negative-night range (checkOut <= checkIn) can't be booked — without this guard
  // the loop below never runs, `isAvailable` never flips false, and `totalPrice / stayDates.length`
  // divides by zero into NaN while still reporting the room type as "available".
  if (stayDates.length === 0) return [];
  const roomTypeIds = roomTypeCandidates.map((roomType) => roomType.id);
  const [overrides, overlappingBookings] = await Promise.all([
    findRateOverridesForRoomTypes(roomTypeIds, stayDates),
    findOverlappingBookings(roomTypeIds, params.checkIn, params.checkOut, HELD_BOOKING_STATUSES),
  ]);

  const overridesByRoomType = new Map<string, Map<string, (typeof overrides)[number]>>();
  for (const row of overrides) {
    if (!overridesByRoomType.has(row.roomTypeId)) {
      overridesByRoomType.set(row.roomTypeId, new Map());
    }
    overridesByRoomType.get(row.roomTypeId)?.set(row.date, row);
  }
  const bookedByRoomType = buildBookedCountsByRoomType(overlappingBookings, stayDates);

  const qualifying: QualifyingRoomType[] = [];
  for (const roomType of roomTypeCandidates) {
    const overridesByDate = overridesByRoomType.get(roomType.id);
    const bookedByDate = bookedByRoomType.get(roomType.id);

    let isAvailable = true;
    let totalPrice = 0;
    for (const date of stayDates) {
      const override = overridesByDate?.get(date);
      const effectiveInventory = (override?.availableOverride ?? roomType.totalInventory) - (bookedByDate?.get(date) ?? 0);
      if (effectiveInventory < params.rooms) {
        isAvailable = false;
        break;
      }
      totalPrice += override?.price ?? roomType.basePrice;
    }
    if (!isAvailable) continue;

    const hotel = params.hotelsById.get(roomType.hotelId);
    const freeCancellation = roomType.freeCancellation ?? hotel?.freeCancellation ?? false;
    if (params.freeCancellationOnly && !freeCancellation) continue;

    qualifying.push({
      roomTypeId: roomType.id,
      hotelId: roomType.hotelId,
      name: roomType.name,
      mealPlanId: roomType.mealPlanId,
      roomFeatureIds: roomType.roomFeatureIds,
      freeCancellation,
      avgNightlyPrice: totalPrice / stayDates.length,
    });
  }
  return qualifying;
}

export function pickCheapestPerHotel(roomTypes: QualifyingRoomType[]): Map<string, QualifyingRoomType> {
  const cheapestByHotel = new Map<string, QualifyingRoomType>();
  for (const roomType of roomTypes) {
    const current = cheapestByHotel.get(roomType.hotelId);
    if (!current || roomType.avgNightlyPrice < current.avgNightlyPrice) {
      cheapestByHotel.set(roomType.hotelId, roomType);
    }
  }
  return cheapestByHotel;
}

export interface RoomTypeAvailability {
  roomTypeId: string;
  avgNightlyPrice: number;
  remainingInventory: number;
}

interface RoomTypeForAvailability {
  id: string;
  basePrice: number;
  totalInventory: number;
}

// Same per-night rate-override math as findQualifyingRoomTypes, generalized to report the
// actual remaining stock (min effective inventory across the stay) instead of a pass/fail
// boolean gated on a specific `rooms` count — used by the hotel details page, where a
// sold-out room type should still render (with 0 remaining), not silently disappear. Also
// reused by booking.service.ts's insert-time re-check against a single room type.
export function resolveRoomTypeAvailability(
  roomTypes: RoomTypeForAvailability[],
  stayDates: string[],
  overrides: RateOverrideRow[],
  overlappingBookings: OverlappingBookingRow[] = [],
): Map<string, RoomTypeAvailability> {
  const overridesByRoomType = new Map<string, Map<string, RateOverrideRow>>();
  for (const row of overrides) {
    if (!overridesByRoomType.has(row.roomTypeId)) {
      overridesByRoomType.set(row.roomTypeId, new Map());
    }
    overridesByRoomType.get(row.roomTypeId)?.set(row.date, row);
  }
  const bookedByRoomType = buildBookedCountsByRoomType(overlappingBookings, stayDates);

  const result = new Map<string, RoomTypeAvailability>();
  for (const roomType of roomTypes) {
    const overridesByDate = overridesByRoomType.get(roomType.id);
    const bookedByDate = bookedByRoomType.get(roomType.id);

    let remainingInventory = roomType.totalInventory;
    let totalPrice = 0;
    for (const date of stayDates) {
      const override = overridesByDate?.get(date);
      const effectiveInventory = (override?.availableOverride ?? roomType.totalInventory) - (bookedByDate?.get(date) ?? 0);
      remainingInventory = Math.min(remainingInventory, effectiveInventory);
      totalPrice += override?.price ?? roomType.basePrice;
    }

    result.set(roomType.id, {
      roomTypeId: roomType.id,
      avgNightlyPrice: stayDates.length > 0 ? totalPrice / stayDates.length : roomType.basePrice,
      remainingInventory,
    });
  }
  return result;
}
