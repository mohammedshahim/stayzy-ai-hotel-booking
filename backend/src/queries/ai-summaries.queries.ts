import { eq } from "drizzle-orm";
import { db } from "../config/db";
import {
  compareAiSummaries,
  hotelAiSummaries,
  type CompareAiSummary,
  type HotelAiSummary,
} from "../models/ai.schema";

export async function findHotelSummary(hotelId: string): Promise<HotelAiSummary | null> {
  const [row] = await db.select().from(hotelAiSummaries).where(eq(hotelAiSummaries.hotelId, hotelId)).limit(1);
  return row ?? null;
}

export interface UpsertHotelSummaryParams {
  hotelId: string;
  contentHash: string;
  summary: string;
  modelVersion: string;
}

export async function upsertHotelSummary(params: UpsertHotelSummaryParams): Promise<HotelAiSummary> {
  const [row] = await db
    .insert(hotelAiSummaries)
    .values(params)
    .onConflictDoUpdate({
      target: hotelAiSummaries.hotelId,
      set: {
        contentHash: params.contentHash,
        summary: params.summary,
        modelVersion: params.modelVersion,
        generatedAt: new Date().toISOString(),
      },
    })
    .returning();
  return row!;
}

export async function findCompareSummary(hotelIdsHash: string): Promise<CompareAiSummary | null> {
  const [row] = await db
    .select()
    .from(compareAiSummaries)
    .where(eq(compareAiSummaries.hotelIdsHash, hotelIdsHash))
    .limit(1);
  return row ?? null;
}

export interface UpsertCompareSummaryParams {
  hotelIdsHash: string;
  contentHash: string;
  summary: string;
  modelVersion: string;
}

export async function upsertCompareSummary(params: UpsertCompareSummaryParams): Promise<CompareAiSummary> {
  const [row] = await db
    .insert(compareAiSummaries)
    .values(params)
    .onConflictDoUpdate({
      target: compareAiSummaries.hotelIdsHash,
      set: {
        contentHash: params.contentHash,
        summary: params.summary,
        modelVersion: params.modelVersion,
        generatedAt: new Date().toISOString(),
      },
    })
    .returning();
  return row!;
}
