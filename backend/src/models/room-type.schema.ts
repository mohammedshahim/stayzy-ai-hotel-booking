import { sql } from "drizzle-orm";
import { boolean, date, integer, numeric, pgTable, primaryKey, text, timestamp, unique, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { hotels } from "./hotel.schema";

export const mealPlans = pgTable("meal_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
});

export const roomTypes = pgTable("room_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  hotelId: uuid("hotel_id")
    .notNull()
    .references(() => hotels.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  maxAdults: integer("max_adults").notNull(),
  maxKids: integer("max_kids").notNull().default(0),
  basePrice: numeric("base_price", { mode: "number" }).notNull(),
  totalInventory: integer("total_inventory").notNull(),
  // Nullable: null inherits hotels.freeCancellation, true/false overrides it explicitly.
  freeCancellation: boolean("free_cancellation"),
  mealPlanId: uuid("meal_plan_id").references(() => mealPlans.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
});

export const roomFeatures = pgTable("room_features", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
});

export const roomTypeFeatures = pgTable(
  "room_type_features",
  {
    roomTypeId: uuid("room_type_id")
      .notNull()
      .references(() => roomTypes.id, { onDelete: "cascade" }),
    roomFeatureId: uuid("room_feature_id")
      .notNull()
      .references(() => roomFeatures.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.roomTypeId, table.roomFeatureId] })],
);

export const roomTypeImages = pgTable(
  "room_type_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomTypeId: uuid("room_type_id")
      .notNull()
      .references(() => roomTypes.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    isMain: boolean("is_main").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("room_type_images_one_main_per_room_type_idx")
      .on(table.roomTypeId)
      .where(sql`${table.isMain} = true`),
  ],
);

export const rateOverrides = pgTable(
  "rate_overrides",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomTypeId: uuid("room_type_id")
      .notNull()
      .references(() => roomTypes.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    price: numeric("price", { mode: "number" }),
    availableOverride: integer("available_override"),
  },
  (table) => [unique("rate_overrides_room_type_id_date_key").on(table.roomTypeId, table.date)],
);

export type MealPlan = typeof mealPlans.$inferSelect;
export type RoomType = typeof roomTypes.$inferSelect;
export type RoomTypeInput = typeof roomTypes.$inferInsert;
export type RoomFeature = typeof roomFeatures.$inferSelect;
export type RoomTypeImage = typeof roomTypeImages.$inferSelect;
export type RateOverride = typeof rateOverrides.$inferSelect;
export type RateOverrideInput = typeof rateOverrides.$inferInsert;
