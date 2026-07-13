import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { ImageOffIcon, UsersIcon } from "lucide-react";

import type { BookingSummary } from "@/features/booking/types";
import { BookingStatusBadge } from "@/features/booking/components/BookingStatusBadge";

type Props = {
  booking: BookingSummary;
};

export function BookingSummaryCard({ booking }: Props) {
  const nights = Math.max(1, differenceInCalendarDays(parseISO(booking.checkOut), parseISO(booking.checkIn)));
  const guestsLabel = `${booking.adults} adult${booking.adults === 1 ? "" : "s"}${booking.kids > 0 ? `, ${booking.kids} kid${booking.kids === 1 ? "" : "s"}` : ""}`;

  return (
    <div className="overflow-hidden rounded-2xl border border-border-default bg-surface">
      <div className="flex items-center justify-between border-b border-border-default px-5 py-4">
        <h2 className="text-lg font-semibold text-text-primary">Booking Summary</h2>
        <BookingStatusBadge status={booking.status} />
      </div>
      <div className="flex flex-col gap-4 p-5">
        <div className="flex gap-3">
          <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-subtle">
            {booking.hotelMainImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- S3-hosted photos, no next/image domain configured yet
              <img src={booking.hotelMainImageUrl} alt={booking.hotelName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ImageOffIcon className="h-5 w-5 text-text-faint" strokeWidth={1.5} />
              </div>
            )}
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-sm font-medium text-text-primary">{booking.hotelName}</p>
            <p className="text-xs text-text-muted">
              {booking.hotelCity}, {booking.hotelCountry}
            </p>
            <p className="text-xs text-text-muted">{booking.roomTypeName}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-border-default pt-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-text-muted">Dates</span>
            <span className="text-text-primary">
              {format(parseISO(booking.checkIn), "MMM d")} – {format(parseISO(booking.checkOut), "MMM d, yyyy")}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-muted">Guests</span>
            <span className="inline-flex items-center gap-1.5 text-text-primary">
              <UsersIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
              {guestsLabel}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-muted">Rooms</span>
            <span className="text-text-primary">{booking.roomsBooked}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1 border-t border-border-default pt-4 text-sm">
          <div className="flex items-center justify-between text-text-muted">
            <span>
              {nights} night{nights === 1 ? "" : "s"} × {booking.roomsBooked} room{booking.roomsBooked === 1 ? "" : "s"}
            </span>
          </div>
          <div className="flex items-center justify-between text-base font-semibold text-text-primary">
            <span>Total</span>
            <span>${booking.totalPrice}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
