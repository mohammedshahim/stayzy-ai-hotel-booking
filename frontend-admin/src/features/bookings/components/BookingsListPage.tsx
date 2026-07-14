import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CalendarRange } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BookingStatusBadge } from "@/features/bookings/components/BookingStatusBadge";
import { BookingsTableSkeleton } from "@/features/bookings/components/BookingsTableSkeleton";
import { useGetBookingsQuery } from "@/features/bookings/bookingsApi";
import { useGetHotelsQuery } from "@/features/hotels/hotelsApi";
import type { BookingStatus } from "@/features/bookings/types";

const PAGE_SIZE = 20;
const HOTEL_FILTER_PAGE_SIZE = 100;

const STATUS_OPTIONS: { value: BookingStatus; label: string }[] = [
  { value: "pending_payment", label: "Pending payment" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "failed", label: "Failed" },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function BookingsListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<BookingStatus | "all">("all");
  const [hotelId, setHotelId] = useState("all");
  const [checkInFrom, setCheckInFrom] = useState("");
  const [checkInTo, setCheckInTo] = useState("");

  const { data: hotelsData } = useGetHotelsQuery({ page: 1, pageSize: HOTEL_FILTER_PAGE_SIZE });
  const { data, isLoading, isError } = useGetBookingsQuery({
    status: status === "all" ? undefined : status,
    hotelId: hotelId === "all" ? undefined : hotelId,
    checkInFrom: checkInFrom || undefined,
    checkInTo: checkInTo || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const hasActiveFilters = status !== "all" || hotelId !== "all" || !!checkInFrom || !!checkInTo;

  function clearFilters() {
    setStatus("all");
    setHotelId("all");
    setCheckInFrom("");
    setCheckInTo("");
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary">Bookings</h1>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-border-default bg-surface p-4">
        <div className="flex flex-col gap-1.5">
          <Label>Status</Label>
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value as BookingStatus | "all");
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Hotel</Label>
          <Select
            value={hotelId}
            onValueChange={(value) => {
              setHotelId(value as string);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All hotels</SelectItem>
              {hotelsData?.items.map((hotel) => (
                <SelectItem key={hotel.id} value={hotel.id}>
                  {hotel.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="checkInFrom">Check-in from</Label>
          <Input
            id="checkInFrom"
            type="date"
            value={checkInFrom}
            max={checkInTo || undefined}
            onChange={(event) => {
              setCheckInFrom(event.target.value);
              setPage(1);
            }}
            className="w-40"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="checkInTo">Check-in to</Label>
          <Input
            id="checkInTo"
            type="date"
            value={checkInTo}
            min={checkInFrom || undefined}
            onChange={(event) => {
              setCheckInTo(event.target.value);
              setPage(1);
            }}
            className="w-40"
          />
        </div>

        {hasActiveFilters && (
          <Button variant="outline" className="h-8 rounded-xl px-3 text-sm" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border-default bg-surface">
        <Table>
          <TableHeader>
            <TableRow className="bg-subtle hover:bg-subtle">
              <TableHead className="px-4 py-3 text-xs font-medium tracking-wide text-text-muted uppercase">
                Guest
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-medium tracking-wide text-text-muted uppercase">
                Hotel
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-medium tracking-wide text-text-muted uppercase">
                Room type
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-medium tracking-wide text-text-muted uppercase">
                Dates
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-medium tracking-wide text-text-muted uppercase">
                Total
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-medium tracking-wide text-text-muted uppercase">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <BookingsTableSkeleton />}
            {!isLoading && isError && (
              <TableRow className="border-b border-border-default last:border-0 hover:bg-elevated">
                <TableCell colSpan={6} className="p-0">
                  <EmptyState
                    icon={AlertTriangle}
                    iconClassName="text-error"
                    heading="Couldn't load bookings"
                    body="Something went wrong fetching this data. Try refreshing the page."
                  />
                </TableCell>
              </TableRow>
            )}
            {!isLoading && !isError && data?.items.length === 0 && (
              <TableRow className="border-b border-border-default last:border-0 hover:bg-elevated">
                <TableCell colSpan={6} className="p-0">
                  <EmptyState icon={CalendarRange} heading="No bookings found" body="Try adjusting or clearing the filters above." />
                </TableCell>
              </TableRow>
            )}
            {data?.items.map((booking) => (
              <TableRow
                key={booking.id}
                onClick={() => navigate(`/bookings/${booking.id}`)}
                className="cursor-pointer border-b border-border-default transition-colors last:border-0 hover:bg-elevated"
              >
                <TableCell className="px-4 py-3 text-sm text-text-secondary">
                  <div className="flex flex-col">
                    <span className="font-medium text-text-primary">{booking.guestName}</span>
                    <span className="text-xs text-text-faint">{booking.guestEmail}</span>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 text-sm text-text-secondary">
                  <div className="flex items-center gap-3">
                    <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-subtle">
                      {booking.hotelMainImageUrl && (
                        <img src={booking.hotelMainImageUrl} alt="" className="size-full object-cover" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-text-primary">{booking.hotelName}</span>
                      <span className="text-xs text-text-faint">
                        {booking.hotelCity}, {booking.hotelCountry}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 text-sm text-text-secondary">{booking.roomTypeName}</TableCell>
                <TableCell className="px-4 py-3 text-sm text-text-secondary">
                  {formatDate(booking.checkIn)} – {formatDate(booking.checkOut)}
                </TableCell>
                <TableCell className="px-4 py-3 text-sm text-text-secondary">${booking.totalPrice}</TableCell>
                <TableCell className="px-4 py-3 text-sm text-text-secondary">
                  <BookingStatusBadge status={booking.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {data && data.total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-text-muted">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="h-8 rounded-xl px-3"
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              className="h-8 rounded-xl px-3"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
