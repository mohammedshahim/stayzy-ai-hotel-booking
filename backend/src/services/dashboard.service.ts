import {
  findRecentBookingsForAdmin,
  findUpcomingCheckInsForAdmin,
  findUpcomingCheckOutsForAdmin,
} from "../queries/booking.queries";
import type { AdminBookingSummaryRow } from "../queries/booking.queries";
import { findDashboardBookingStats, findPublishedRoomInventoryTotal, findTopHotelsByBookingCount } from "../queries/dashboard.queries";
import type { TopHotelRow } from "../queries/dashboard.queries";
import { addDaysIso, firstOfMonthIso, todayIso } from "../utils/date";

const RECENT_BOOKINGS_LIMIT = 10;
const TOP_HOTELS_LIMIT = 5;
const UPCOMING_LIMIT = 10;
const UPCOMING_WINDOW_DAYS = 7;

export interface AdminDashboardData {
  range: { checkInFrom: string; checkInTo: string };
  totalBookings: number;
  revenue: number;
  occupancyRate: number;
  cancellationRate: number;
  topHotels: TopHotelRow[];
  recentBookings: AdminBookingSummaryRow[];
  upcomingCheckIns: AdminBookingSummaryRow[];
  upcomingCheckOuts: AdminBookingSummaryRow[];
}

// checkInFrom/checkInTo are inclusive calendar-day bounds (as picked in the UI); every range-scoped query
// internally works with an exclusive upper bound, one day past checkInTo.
export async function getAdminDashboard(checkInFromInput?: string, checkInToInput?: string): Promise<AdminDashboardData> {
  const checkInFrom = checkInFromInput ?? firstOfMonthIso();
  const checkInTo = checkInToInput ?? todayIso();
  const rangeEndExclusive = addDaysIso(checkInTo, 1);
  const rangeNights = Math.max(1, Math.round((Date.parse(rangeEndExclusive) - Date.parse(checkInFrom)) / 86_400_000));

  const today = todayIso();
  const upcomingEndExclusive = addDaysIso(today, UPCOMING_WINDOW_DAYS);

  const [stats, totalInventory, topHotels, recentBookings, upcomingCheckIns, upcomingCheckOuts] = await Promise.all([
    findDashboardBookingStats(checkInFrom, rangeEndExclusive),
    findPublishedRoomInventoryTotal(),
    findTopHotelsByBookingCount(checkInFrom, rangeEndExclusive, TOP_HOTELS_LIMIT),
    findRecentBookingsForAdmin(RECENT_BOOKINGS_LIMIT),
    findUpcomingCheckInsForAdmin(today, upcomingEndExclusive, UPCOMING_LIMIT),
    findUpcomingCheckOutsForAdmin(today, upcomingEndExclusive, UPCOMING_LIMIT),
  ]);

  const occupancyDenominator = totalInventory * rangeNights;
  const occupancyRate = occupancyDenominator > 0 ? (stats.bookedRoomNights / occupancyDenominator) * 100 : 0;
  const cancellationRate = stats.totalBookings > 0 ? (stats.cancelledCount / stats.totalBookings) * 100 : 0;

  return {
    range: { checkInFrom, checkInTo },
    totalBookings: stats.totalBookings,
    revenue: stats.revenue,
    occupancyRate,
    cancellationRate,
    topHotels,
    recentBookings,
    upcomingCheckIns,
    upcomingCheckOuts,
  };
}
