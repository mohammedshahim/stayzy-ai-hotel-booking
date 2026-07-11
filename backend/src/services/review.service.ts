import type { Hotel } from "../models/hotel.schema";
import type { HotelReviewsResult } from "../models/booking.schema";
import { countReviewsByHotel, findReviewsByHotel, getRatingBreakdown } from "../queries/reviews.queries";

export async function getHotelReviews(hotel: Hotel, page: number, pageSize: number): Promise<HotelReviewsResult> {
  const totalRealReviews = await countReviewsByHotel(hotel.id);

  // No real reviews yet for this hotel (Booking/Review Creation land in later features) —
  // fall back to the hotel's own stored averageRating/reviewCount rather than showing 0s
  // that would contradict the header above this section.
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
