import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookingStatusBadge } from "@/features/bookings/components/BookingStatusBadge";
import { useGetDashboardQuery } from "@/features/dashboard/dashboardApi";
import type { AdminBookingListItem } from "@/features/bookings/types";
import type { TopHotel } from "@/features/dashboard/types";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function firstOfMonthIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)).toISOString().slice(0, 10);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border-default bg-elevated p-5 shadow-card">
      <span className="text-2xl font-bold text-text-primary">{value}</span>
      <p className="mt-1 text-xs tracking-wide text-text-muted uppercase">{label}</p>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border-default bg-surface p-6">
      <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
      {children}
    </div>
  );
}

function EmptyRow({ message }: { message: string }) {
  return <p className="py-6 text-center text-sm text-text-faint">{message}</p>;
}

function BookingFeedRow({ booking, dateField }: { booking: AdminBookingListItem; dateField: "checkIn" | "checkOut" }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(`/bookings/${booking.id}`)}
      className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-elevated"
    >
      <div className="flex flex-col">
        <span className="text-sm font-medium text-text-primary">{booking.guestName}</span>
        <span className="text-xs text-text-faint">
          {booking.hotelName} · {formatDate(booking[dateField])}
        </span>
      </div>
      <BookingStatusBadge status={booking.status} />
    </button>
  );
}

function TopHotelRow({ hotel, rank }: { hotel: TopHotel; rank: number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5">
      <div className="flex items-center gap-3">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-subtle text-xs font-medium text-text-muted">
          {rank}
        </span>
        <span className="text-sm font-medium text-text-primary">{hotel.hotelName}</span>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-sm font-medium text-text-primary">${hotel.revenue.toLocaleString()}</span>
        <span className="text-xs text-text-faint">
          {hotel.bookingCount} booking{hotel.bookingCount === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const [checkInFrom, setCheckInFrom] = useState(firstOfMonthIso);
  const [checkInTo, setCheckInTo] = useState(todayIso);

  const { data, isLoading, isError } = useGetDashboardQuery({ checkInFrom, checkInTo });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary">Dashboard</h1>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-border-default bg-surface p-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dashboardFrom">From</Label>
          <Input
            id="dashboardFrom"
            type="date"
            value={checkInFrom}
            max={checkInTo}
            onChange={(event) => setCheckInFrom(event.target.value)}
            className="w-40"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dashboardTo">To</Label>
          <Input
            id="dashboardTo"
            type="date"
            value={checkInTo}
            min={checkInFrom}
            onChange={(event) => setCheckInTo(event.target.value)}
            className="w-40"
          />
        </div>
      </div>

      {isError && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border-default bg-surface py-16">
          <AlertTriangle className="size-10 text-error" />
          <p className="text-base font-medium text-text-muted">Couldn't load the dashboard</p>
          <p className="max-w-xs text-center text-sm text-text-faint">Something went wrong fetching this data. Try refreshing the page.</p>
        </div>
      )}

      {isLoading && <p className="text-sm text-text-muted">Loading dashboard...</p>}

      {!isLoading && !isError && data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total bookings" value={data.totalBookings.toLocaleString()} />
            <StatCard label="Revenue" value={`$${data.revenue.toLocaleString()}`} />
            <StatCard label="Occupancy rate" value={`${data.occupancyRate.toFixed(1)}%`} />
            <StatCard label="Cancellation rate" value={`${data.cancellationRate.toFixed(1)}%`} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title="Top hotels">
              {data.topHotels.length === 0 ? (
                <EmptyRow message="No bookings in this range." />
              ) : (
                <div className="flex flex-col">
                  {data.topHotels.map((hotel, index) => (
                    <TopHotelRow key={hotel.hotelId} hotel={hotel} rank={index + 1} />
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Recent bookings">
              {data.recentBookings.length === 0 ? (
                <EmptyRow message="No bookings yet." />
              ) : (
                <div className="flex flex-col">
                  {data.recentBookings.map((booking) => (
                    <BookingFeedRow key={booking.id} booking={booking} dateField="checkIn" />
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title="Upcoming check-ins (next 7 days)">
              {data.upcomingCheckIns.length === 0 ? (
                <EmptyRow message="No check-ins in the next 7 days." />
              ) : (
                <div className="flex flex-col">
                  {data.upcomingCheckIns.map((booking) => (
                    <BookingFeedRow key={booking.id} booking={booking} dateField="checkIn" />
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Upcoming check-outs (next 7 days)">
              {data.upcomingCheckOuts.length === 0 ? (
                <EmptyRow message="No check-outs in the next 7 days." />
              ) : (
                <div className="flex flex-col">
                  {data.upcomingCheckOuts.map((booking) => (
                    <BookingFeedRow key={booking.id} booking={booking} dateField="checkOut" />
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        </>
      )}
    </div>
  );
}
