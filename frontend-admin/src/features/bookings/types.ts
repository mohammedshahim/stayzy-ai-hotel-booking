export type BookingStatus = "pending_payment" | "confirmed" | "cancelled" | "completed" | "failed";

export interface AdminBookingListItem {
  id: string;
  hotelId: string;
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  kids: number;
  roomsBooked: number;
  totalPrice: number;
  status: BookingStatus;
  createdAt: string;
  hotelName: string;
  hotelCity: string;
  hotelCountry: string;
  hotelMainImageUrl: string | null;
  roomTypeName: string;
  guestName: string;
  guestEmail: string;
}

export interface ListBookingsResponse {
  items: AdminBookingListItem[];
  total: number;
}

export interface ListBookingsParams {
  status?: BookingStatus;
  hotelId?: string;
  checkInFrom?: string;
  checkInTo?: string;
  page: number;
  pageSize: number;
}
