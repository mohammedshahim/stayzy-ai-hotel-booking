import { getRoomTypeById } from "../queries/room-types.queries";
import {
  deleteRateOverridesInRange,
  listRateOverridesByRoomType,
  upsertRateOverrides,
} from "../queries/rate-overrides.queries";
import type { CreateRateOverrideRangeInput, DeleteRateOverrideRangeInput } from "../types/room-type.schemas";

export interface RateOverrideRange {
  startDate: string;
  endDate: string;
  price: number | null;
  availableOverride: number | null;
}

function enumerateDates(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

function nextDate(date: string): string {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().slice(0, 10);
}

// Rate overrides are stored one row per date, but an admin thinks in ranges — group consecutive same-value dates back into a range for display.
function groupIntoRanges(
  rows: { date: string; price: number | null; availableOverride: number | null }[],
): RateOverrideRange[] {
  const ranges: RateOverrideRange[] = [];
  for (const row of rows) {
    const last = ranges[ranges.length - 1];
    if (last && last.price === row.price && last.availableOverride === row.availableOverride && nextDate(last.endDate) === row.date) {
      last.endDate = row.date;
    } else {
      ranges.push({ startDate: row.date, endDate: row.date, price: row.price, availableOverride: row.availableOverride });
    }
  }
  return ranges;
}

async function assertRoomTypeExists(roomTypeId: string): Promise<void> {
  const roomType = await getRoomTypeById(roomTypeId);
  if (!roomType) {
    throw new Error("Room type not found");
  }
}

export async function listRateOverridesForRoomType(roomTypeId: string): Promise<RateOverrideRange[]> {
  const rows = await listRateOverridesByRoomType(roomTypeId);
  return groupIntoRanges(rows);
}

export async function createRateOverrideRange(
  roomTypeId: string,
  input: CreateRateOverrideRangeInput,
): Promise<RateOverrideRange[]> {
  await assertRoomTypeExists(roomTypeId);
  const dates = enumerateDates(input.startDate, input.endDate);
  await upsertRateOverrides(
    roomTypeId,
    dates.map((date) => ({ date, price: input.price, availableOverride: input.availableOverride })),
  );
  return listRateOverridesForRoomType(roomTypeId);
}

export async function deleteRateOverrideRange(
  roomTypeId: string,
  input: DeleteRateOverrideRangeInput,
): Promise<RateOverrideRange[]> {
  await assertRoomTypeExists(roomTypeId);
  await deleteRateOverridesInRange(roomTypeId, input.startDate, input.endDate);
  return listRateOverridesForRoomType(roomTypeId);
}
