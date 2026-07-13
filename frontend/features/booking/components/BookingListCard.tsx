import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ImageOffIcon } from "lucide-react";

import { BookingStatusBadge } from "@/features/booking/components/BookingStatusBadge";
import type { BookingSummary } from "@/features/booking/types";

type Props = {
  booking: BookingSummary;
};

export function BookingListCard({ booking }: Props) {
  return (
    <Link
      href={`/bookings/${booking.id}`}
      className="flex flex-col overflow-hidden rounded-2xl border border-border-default bg-elevated shadow-card transition-colors hover:border-border-subtle sm:flex-row"
    >
      <div className="relative aspect-[4/3] w-full shrink-0 sm:aspect-square sm:w-40">
        {booking.hotelMainImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- S3-hosted photos, no next/image domain configured yet
          <img src={booking.hotelMainImageUrl} alt={booking.hotelName} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-subtle">
            <ImageOffIcon className="h-8 w-8 text-text-faint" strokeWidth={1.5} />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-medium text-text-primary">{booking.hotelName}</h3>
            <p className="text-xs text-text-muted">
              {booking.hotelCity}, {booking.hotelCountry}
            </p>
          </div>
          <BookingStatusBadge status={booking.status} />
        </div>

        <p className="text-xs text-text-muted">{booking.roomTypeName}</p>

        <div className="mt-auto flex items-end justify-between pt-2">
          <span className="text-sm text-text-secondary">
            {format(parseISO(booking.checkIn), "MMM d")} – {format(parseISO(booking.checkOut), "MMM d, yyyy")}
          </span>
          <span className="text-lg font-bold text-text-primary">${booking.totalPrice}</span>
        </div>
      </div>
    </Link>
  );
}
