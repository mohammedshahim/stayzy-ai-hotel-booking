import { and, asc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "../config/db";
import { rateOverrides } from "../models/room-type.schema";
import type { RateOverride } from "../models/room-type.schema";

const RATE_OVERRIDE_COLUMNS = {
  id: rateOverrides.id,
  roomTypeId: rateOverrides.roomTypeId,
  date: rateOverrides.date,
  price: rateOverrides.price,
  availableOverride: rateOverrides.availableOverride,
};

export async function listRateOverridesByRoomType(roomTypeId: string): Promise<RateOverride[]> {
  return db
    .select(RATE_OVERRIDE_COLUMNS)
    .from(rateOverrides)
    .where(eq(rateOverrides.roomTypeId, roomTypeId))
    .orderBy(asc(rateOverrides.date));
}

export interface RateOverrideRow {
  date: string;
  price: number | null;
  availableOverride: number | null;
}

export async function upsertRateOverrides(roomTypeId: string, rows: RateOverrideRow[]): Promise<RateOverride[]> {
  if (rows.length === 0) return [];
  return db
    .insert(rateOverrides)
    .values(rows.map((row) => ({ roomTypeId, date: row.date, price: row.price, availableOverride: row.availableOverride })))
    .onConflictDoUpdate({
      target: [rateOverrides.roomTypeId, rateOverrides.date],
      set: { price: sql`excluded.price`, availableOverride: sql`excluded.available_override` },
    })
    .returning(RATE_OVERRIDE_COLUMNS);
}

export async function deleteRateOverridesInRange(roomTypeId: string, startDate: string, endDate: string): Promise<void> {
  await db
    .delete(rateOverrides)
    .where(and(eq(rateOverrides.roomTypeId, roomTypeId), gte(rateOverrides.date, startDate), lte(rateOverrides.date, endDate)));
}

export async function deleteRateOverride(id: string): Promise<void> {
  await db.delete(rateOverrides).where(eq(rateOverrides.id, id));
}
