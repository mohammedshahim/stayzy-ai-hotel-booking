import { sql } from "drizzle-orm";
import { boolean, check, customType, index, integer, numeric, pgTable, primaryKey, text, time, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

// ST_MakePoint takes (longitude, latitude) — reversed from how coordinates are normally said out loud (see library-docs.md's PostGIS rule).
export const geographyPoint = customType<{ data: { latitude: number; longitude: number } }>({
  dataType() {
    return "geography(Point,4326)";
  },
  toDriver(value) {
    return sql`ST_SetSRID(ST_MakePoint(${value.longitude}, ${value.latitude}), 4326)::geography`;
  },
});

export const hotels = pgTable(
  "hotels",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description").notNull(),
    addressLine1: text("address_line1").notNull(),
    addressLine2: text("address_line2"),
    city: text("city").notNull(),
    state: text("state"),
    country: text("country").notNull(),
    postalCode: text("postal_code"),
    location: geographyPoint("location").notNull(),
    starRating: integer("star_rating").notNull(),
    checkInTime: time("check_in_time").notNull(),
    checkOutTime: time("check_out_time").notNull(),
    freeCancellation: boolean("free_cancellation").notNull().default(false),
    cancellationPolicy: text("cancellation_policy").notNull(),
    status: text("status").notNull().default("draft"),
    averageRating: numeric("average_rating", { mode: "number" }).notNull().default(0),
    reviewCount: integer("review_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
  },
  (table) => [
    check("hotels_star_rating_check", sql`${table.starRating} BETWEEN 1 AND 5`),
    check("hotels_status_check", sql`${table.status} IN ('draft', 'published')`),
    index("hotels_location_gist_idx").using("gist", table.location),
  ],
);

export const hotelImages = pgTable(
  "hotel_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    hotelId: uuid("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    isMain: boolean("is_main").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("hotel_images_one_main_per_hotel_idx")
      .on(table.hotelId)
      .where(sql`${table.isMain} = true`),
  ],
);

export const amenities = pgTable("amenities", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  icon: text("icon").notNull(),
});

export const hotelAmenities = pgTable(
  "hotel_amenities",
  {
    hotelId: uuid("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    amenityId: uuid("amenity_id")
      .notNull()
      .references(() => amenities.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.hotelId, table.amenityId] })],
);

// Row shapes below are hand-written, not $inferSelect, since they're a flattened view over the raw table (see HOTEL_COLUMNS in hotels.queries.ts).
export type HotelStatus = "draft" | "published";

export interface Hotel {
  id: string;
  name: string;
  slug: string;
  description: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string | null;
  country: string;
  postalCode: string | null;
  latitude: number;
  longitude: number;
  starRating: number;
  checkInTime: string;
  checkOutTime: string;
  freeCancellation: boolean;
  cancellationPolicy: string;
  status: HotelStatus;
  averageRating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface HotelImage {
  id: string;
  hotelId: string;
  url: string;
  isMain: boolean;
  sortOrder: number;
}

export interface Amenity {
  id: string;
  name: string;
  icon: string;
}

export interface HotelWithDetails extends Hotel {
  amenities: Amenity[];
  images: HotelImage[];
}

export interface HotelListItem {
  id: string;
  name: string;
  city: string;
  country: string;
  starRating: number;
  status: HotelStatus;
  mainImageUrl: string | null;
  createdAt: string;
}

export interface SimilarHotel {
  id: string;
  name: string;
  city: string;
  country: string;
  starRating: number;
  averageRating: number;
  reviewCount: number;
  mainImageUrl: string | null;
}

export interface HotelInput {
  name: string;
  description: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  starRating: number;
  checkInTime: string;
  checkOutTime: string;
  freeCancellation: boolean;
  cancellationPolicy: string;
  status: HotelStatus;
  amenityIds: string[];
}

export interface HotelImageInput {
  url: string;
  isMain: boolean;
  sortOrder: number;
}
