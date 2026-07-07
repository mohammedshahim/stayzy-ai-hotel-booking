import { sql } from "drizzle-orm";
import { check, date, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth.schema";
import { hotels } from "./hotel.schema";

export const favorites = pgTable(
  "favorites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    sessionToken: text("session_token"),
    hotelId: uuid("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (table) => [
    check(
      "favorites_owner_xor_check",
      sql`(${table.userId} IS NOT NULL AND ${table.sessionToken} IS NULL) OR (${table.userId} IS NULL AND ${table.sessionToken} IS NOT NULL)`,
    ),
    uniqueIndex("favorites_user_hotel_idx")
      .on(table.userId, table.hotelId)
      .where(sql`${table.userId} IS NOT NULL`),
    uniqueIndex("favorites_session_hotel_idx")
      .on(table.sessionToken, table.hotelId)
      .where(sql`${table.sessionToken} IS NOT NULL`),
  ],
);

export const recentSearches = pgTable(
  "recent_searches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    sessionToken: text("session_token"),
    destinationQuery: text("destination_query").notNull(),
    checkIn: date("check_in").notNull(),
    checkOut: date("check_out").notNull(),
    adults: integer("adults").notNull(),
    kids: integer("kids").notNull().default(0),
    rooms: integer("rooms").notNull().default(1),
    searchedAt: timestamp("searched_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (table) => [
    check(
      "recent_searches_owner_xor_check",
      sql`(${table.userId} IS NOT NULL AND ${table.sessionToken} IS NULL) OR (${table.userId} IS NULL AND ${table.sessionToken} IS NOT NULL)`,
    ),
  ],
);

export type Favorite = typeof favorites.$inferSelect;
export type RecentSearch = typeof recentSearches.$inferSelect;
