import { desc, eq, sql } from "drizzle-orm";
import { db } from "../config/db";
import { reviews } from "../models/booking.schema";
import type { RatingBreakdown, ReviewListItem } from "../models/booking.schema";
import { user } from "../models/auth.schema";

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
