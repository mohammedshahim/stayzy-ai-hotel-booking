export type CreateBookingParams = {
  hotelId: string;
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  kids: number;
  rooms: number;
};

export type BookingStatus = "pending_payment" | "confirmed" | "cancelled" | "completed" | "failed";

// Shape returned by POST /bookings — mirrors backend's Booking row (booking.schema.ts).
export type Booking = {
  id: string;
  userId: string;
  hotelId: string;
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  kids: number;
  roomsBooked: number;
  totalPrice: number;
  status: BookingStatus;
  stripePaymentIntentId: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

// Shape returned by GET /bookings and GET /bookings/:id — mirrors backend's BookingSummary (booking.service.ts).
export type BookingSummary = Booking & {
  hotelName: string;
  hotelCity: string;
  hotelCountry: string;
  hotelMainImageUrl: string | null;
  roomTypeName: string;
  isCancellable: boolean;
};
