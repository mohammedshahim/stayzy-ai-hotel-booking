import { sql } from "drizzle-orm";
import { check, date, integer, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth.schema";
import { hotels } from "./hotel.schema";
import { roomTypes } from "./room-type.schema";

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    hotelId: uuid("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "restrict" }),
    roomTypeId: uuid("room_type_id")
      .notNull()
      .references(() => roomTypes.id, { onDelete: "restrict" }),
    checkIn: date("check_in").notNull(),
    checkOut: date("check_out").notNull(),
    adults: integer("adults").notNull(),
    kids: integer("kids").notNull().default(0),
    roomsBooked: integer("rooms_booked").notNull(),
    totalPrice: numeric("total_price", { mode: "number" }).notNull(),
    status: text("status").notNull().default("pending_payment"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (table) => [
    check(
      "bookings_status_check",
      sql`${table.status} IN ('pending_payment', 'confirmed', 'cancelled', 'completed', 'failed')`,
    ),
    check("bookings_check_out_after_check_in", sql`${table.checkOut} > ${table.checkIn}`),
  ],
);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id")
      .notNull()
      .unique()
      .references(() => bookings.id, { onDelete: "restrict" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    hotelId: uuid("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "restrict" }),
    rating: integer("rating").notNull(),
    description: text("description").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (table) => [check("reviews_rating_check", sql`${table.rating} BETWEEN 1 AND 5`)],
);

export type Booking = typeof bookings.$inferSelect;
export type BookingInput = typeof bookings.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type ReviewInput = typeof reviews.$inferInsert;

export interface ReviewListItem {
  id: string;
  rating: number;
  description: string;
  createdAt: string;
  reviewerName: string;
  reviewerAvatarUrl: string | null;
}

export type RatingBreakdown = Record<1 | 2 | 3 | 4 | 5, number>;

export interface PaginatedReviews {
  data: ReviewListItem[];
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface HotelReviewsResult {
  averageRating: number;
  reviewCount: number;
  breakdown: RatingBreakdown;
  reviews: PaginatedReviews;
}
