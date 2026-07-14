import type { AdminBookingListItem } from "@/features/bookings/types";

export interface TopHotel {
  hotelId: string;
  hotelName: string;
  bookingCount: number;
  revenue: number;
}

export interface AdminDashboardData {
  range: { checkInFrom: string; checkInTo: string };
  totalBookings: number;
  revenue: number;
  occupancyRate: number;
  cancellationRate: number;
  topHotels: TopHotel[];
  recentBookings: AdminBookingListItem[];
  upcomingCheckIns: AdminBookingListItem[];
  upcomingCheckOuts: AdminBookingListItem[];
}

export interface GetDashboardParams {
  checkInFrom: string;
  checkInTo: string;
}
