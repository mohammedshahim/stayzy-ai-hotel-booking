import { findCandidateRoomTypes, findRateOverridesForRoomTypes } from "../queries/search.queries";
import type { CandidateHotel, RateOverrideRow } from "../queries/search.queries";

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
  const overrides = await findRateOverridesForRoomTypes(
    roomTypeCandidates.map((roomType) => roomType.id),
    stayDates,
  );

  const overridesByRoomType = new Map<string, Map<string, (typeof overrides)[number]>>();
  for (const row of overrides) {
    if (!overridesByRoomType.has(row.roomTypeId)) {
      overridesByRoomType.set(row.roomTypeId, new Map());
    }
    overridesByRoomType.get(row.roomTypeId)?.set(row.date, row);
  }

  const qualifying: QualifyingRoomType[] = [];
  for (const roomType of roomTypeCandidates) {
    const overridesByDate = overridesByRoomType.get(roomType.id);

    let isAvailable = true;
    let totalPrice = 0;
    for (const date of stayDates) {
      const override = overridesByDate?.get(date);
      const effectiveInventory = override?.availableOverride ?? roomType.totalInventory;
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
// sold-out room type should still render (with 0 remaining), not silently disappear.
export function resolveRoomTypeAvailability(
  roomTypes: RoomTypeForAvailability[],
  stayDates: string[],
  overrides: RateOverrideRow[],
): Map<string, RoomTypeAvailability> {
  const overridesByRoomType = new Map<string, Map<string, RateOverrideRow>>();
  for (const row of overrides) {
    if (!overridesByRoomType.has(row.roomTypeId)) {
      overridesByRoomType.set(row.roomTypeId, new Map());
    }
    overridesByRoomType.get(row.roomTypeId)?.set(row.date, row);
  }

  const result = new Map<string, RoomTypeAvailability>();
  for (const roomType of roomTypes) {
    const overridesByDate = overridesByRoomType.get(roomType.id);

    let remainingInventory = roomType.totalInventory;
    let totalPrice = 0;
    for (const date of stayDates) {
      const override = overridesByDate?.get(date);
      const effectiveInventory = override?.availableOverride ?? roomType.totalInventory;
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
