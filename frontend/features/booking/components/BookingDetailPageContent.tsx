"use client";

import { useState } from "react";
import { SearchXIcon } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { useBookingSummary } from "@/features/booking/hooks/useBookingSummary";
import { BookingSummaryCard } from "@/features/booking/components/BookingSummaryCard";
import { CancelBookingSection } from "@/features/booking/components/CancelBookingSection";
import type { Booking } from "@/features/booking/types";

type Props = {
  bookingId: string;
};

export function BookingDetailPageContent({ bookingId }: Props) {
  const { booking: fetchedBooking, isLoading } = useBookingSummary(bookingId);
  const [cancelledBooking, setCancelledBooking] = useState<Booking | null>(null);

  if (isLoading) {
    return <p className="py-16 text-center text-sm text-text-muted">Loading booking…</p>;
  }

  if (!fetchedBooking) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <EmptyState
          icon={SearchXIcon}
          heading="Booking not found"
          body="This booking may not exist, or it doesn't belong to your account."
        />
      </div>
    );
  }

  const booking =
    cancelledBooking && cancelledBooking.id === fetchedBooking.id
      ? { ...fetchedBooking, status: cancelledBooking.status, cancelledAt: cancelledBooking.cancelledAt, isCancellable: false }
      : fetchedBooking;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
      <h1 className="text-2xl font-semibold text-text-primary">Booking Details</h1>
      <BookingSummaryCard booking={booking} />
      <CancelBookingSection booking={booking} onCancelled={setCancelledBooking} />
    </div>
  );
}
