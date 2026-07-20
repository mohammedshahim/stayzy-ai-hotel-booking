import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { hotels } from "./hotel.schema";

export const hotelAiSummaries = pgTable("hotel_ai_summaries", {
  id: uuid("id").primaryKey().defaultRandom(),
  hotelId: uuid("hotel_id")
    .notNull()
    .unique()
    .references(() => hotels.id, { onDelete: "cascade" }),
  contentHash: text("content_hash").notNull(),
  summary: text("summary").notNull(),
  modelVersion: text("model_version").notNull(),
  generatedAt: timestamp("generated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});

export type HotelAiSummary = typeof hotelAiSummaries.$inferSelect;
