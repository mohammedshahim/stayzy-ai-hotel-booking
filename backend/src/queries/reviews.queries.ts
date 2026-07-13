import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../config/db";
import { reviews } from "../models/booking.schema";
import type { RatingBreakdown, Review, ReviewListItem } from "../models/booking.schema";
import { hotels } from "../models/hotel.schema";
import { user } from "../models/auth.schema";
import type { QueryExecutor } from "./search.queries";

export async function countReviewsByHotel(hotelId: string): Promise<number> {
  const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(reviews).where(eq(reviews.hotelId, hotelId));
  return row?.count ?? 0;
}

export async function getRatingBreakdown(hotelId: string): Promise<RatingBreakdown> {
  const rows = await db
    .select({ rating: reviews.rating, count: sql<number>`count(*)::int` })
    .from(reviews)
    .where(eq(reviews.hotelId, hotelId))
    .groupBy(reviews.rating);

  const breakdown: RatingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const row of rows) {
    if (row.rating >= 1 && row.rating <= 5) {
      breakdown[row.rating as 1 | 2 | 3 | 4 | 5] = row.count;
    }
  }
  return breakdown;
}

export async function findReviewsByHotel(hotelId: string, page: number, pageSize: number): Promise<ReviewListItem[]> {
  const rows = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      description: reviews.description,
      createdAt: reviews.createdAt,
      reviewerName: user.name,
      reviewerAvatarUrl: user.avatarUrl,
    })
    .from(reviews)
    .innerJoin(user, eq(reviews.userId, user.id))
    .where(eq(reviews.hotelId, hotelId))
    .orderBy(desc(reviews.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return rows;
}

export async function findReviewByBookingIdForOwner(bookingId: string, userId: string): Promise<Review | null> {
  const [row] = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.bookingId, bookingId), eq(reviews.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function insertReview(
  tx: QueryExecutor,
  data: { bookingId: string; userId: string; hotelId: string; rating: number; description: string },
): Promise<Review> {
  const [row] = await tx.insert(reviews).values(data).returning();
  if (!row) throw new Error("Failed to insert review");
  return row;
}

export async function updateReviewByBookingIdForOwner(
  tx: QueryExecutor,
  bookingId: string,
  userId: string,
  data: { rating: number; description: string },
): Promise<Review | null> {
  const [row] = await tx
    .update(reviews)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(and(eq(reviews.bookingId, bookingId), eq(reviews.userId, userId)))
    .returning();
  return row ?? null;
}

export async function deleteReviewByBookingIdForOwner(tx: QueryExecutor, bookingId: string, userId: string): Promise<Review | null> {
  const [row] = await tx
    .delete(reviews)
    .where(and(eq(reviews.bookingId, bookingId), eq(reviews.userId, userId)))
    .returning();
  return row ?? null;
}

// Full recompute (not incremental counters) so average_rating/review_count can never drift from the reviews table, even across edits/deletes.
export async function recalculateHotelRatingStats(tx: QueryExecutor, hotelId: string): Promise<void> {
  await tx
    .update(hotels)
    .set({
      averageRating: sql`COALESCE((SELECT AVG(${reviews.rating}) FROM ${reviews} WHERE ${reviews.hotelId} = ${hotelId}), 0)`,
      reviewCount: sql`(SELECT COUNT(*)::int FROM ${reviews} WHERE ${reviews.hotelId} = ${hotelId})`,
    })
    .where(eq(hotels.id, hotelId));
}
