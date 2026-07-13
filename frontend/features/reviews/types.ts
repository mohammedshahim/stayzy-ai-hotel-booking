export type ReviewInput = {
  rating: number;
  description: string;
};

// Shape returned by POST/PATCH /bookings/:id/review — mirrors backend's Review row (booking.schema.ts).
export type OwnReview = {
  id: string;
  bookingId: string;
  userId: string;
  hotelId: string;
  rating: number;
  description: string;
  createdAt: string;
  updatedAt: string;
};
