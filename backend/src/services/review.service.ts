import { db } from "../config/db";
import type { Hotel } from "../models/hotel.schema";
import type { HotelReviewsResult, Review } from "../models/booking.schema";
import { findBookingByIdForOwner } from "../queries/booking.queries";
import {
  countReviewsByHotel,
  deleteReviewByBookingIdForOwner,
  findReviewByBookingIdForOwner,
  findReviewsByHotel,
  getRatingBreakdown,
  insertReview,
  recalculateHotelRatingStats,
  updateReviewByBookingIdForOwner,
} from "../queries/reviews.queries";
import type { WriteReviewInput } from "../types/review.schemas";

const UNIQUE_VIOLATION = "23505";

// Tagged 400 so errorHandler.ts's `err.status ?? 500` doesn't log routine caller-fault failures as server errors.
function badRequest(message: string): Error {
  return Object.assign(new Error(message), { status: 400 });
}

export async function getHotelReviews(hotel: Hotel, page: number, pageSize: number): Promise<HotelReviewsResult> {
  const totalRealReviews = await countReviewsByHotel(hotel.id);

  // No real reviews yet — fall back to the hotel's stored averageRating/reviewCount rather than showing 0s that contradict the header above.
  if (totalRealReviews === 0) {
    return {
      averageRating: hotel.averageRating,
      reviewCount: hotel.reviewCount,
      breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      reviews: { data: [], page: 1, pageSize, totalPages: 0 },
    };
  }

  const [breakdown, data] = await Promise.all([getRatingBreakdown(hotel.id), findReviewsByHotel(hotel.id, page, pageSize)]);

  const averageRating =
    (1 * breakdown[1] + 2 * breakdown[2] + 3 * breakdown[3] + 4 * breakdown[4] + 5 * breakdown[5]) / totalRealReviews;

  return {
    averageRating: Math.round(averageRating * 10) / 10,
    reviewCount: totalRealReviews,
    breakdown,
    reviews: {
      data,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(totalRealReviews / pageSize)),
    },
  };
}

export async function getOwnReviewForBooking(bookingId: string, userId: string): Promise<Review | null> {
  return findReviewByBookingIdForOwner(bookingId, userId);
}

export async function createReviewForBooking(bookingId: string, userId: string, input: WriteReviewInput): Promise<Review> {
  const booking = await findBookingByIdForOwner(bookingId, userId);
  if (!booking) throw Object.assign(new Error("Booking not found"), { status: 404 });
  if (booking.status !== "completed") {
    throw badRequest("Only completed bookings can be reviewed");
  }

  try {
    return await db.transaction(async (tx) => {
      const review = await insertReview(tx, {
        bookingId,
        userId,
        hotelId: booking.hotelId,
        rating: input.rating,
        description: input.description,
      });
      await recalculateHotelRatingStats(tx, booking.hotelId);
      return review;
    });
  } catch (error) {
    // pg driver errors arrive wrapped in DrizzleQueryError's `.cause`, not on the error itself.
    const code = (error as { cause?: { code?: string } }).cause?.code;
    if (code === UNIQUE_VIOLATION) throw badRequest("This booking has already been reviewed");
    throw error;
  }
}

export async function updateReviewForBooking(bookingId: string, userId: string, input: WriteReviewInput): Promise<Review | null> {
  const existing = await findReviewByBookingIdForOwner(bookingId, userId);
  if (!existing) return null;

  return db.transaction(async (tx) => {
    const review = await updateReviewByBookingIdForOwner(tx, bookingId, userId, input);
    if (!review) throw new Error("Review could not be updated");
    await recalculateHotelRatingStats(tx, review.hotelId);
    return review;
  });
}

export async function deleteReviewForBooking(bookingId: string, userId: string): Promise<boolean> {
  const existing = await findReviewByBookingIdForOwner(bookingId, userId);
  if (!existing) return false;

  await db.transaction(async (tx) => {
    const review = await deleteReviewByBookingIdForOwner(tx, bookingId, userId);
    if (!review) throw new Error("Review could not be deleted");
    await recalculateHotelRatingStats(tx, review.hotelId);
  });
  return true;
}
