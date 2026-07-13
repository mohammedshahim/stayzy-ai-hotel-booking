"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useCancelBooking } from "@/features/booking/hooks/useCancelBooking";
import type { Booking, BookingSummary } from "@/features/booking/types";

type Props = {
  booking: BookingSummary;
  onCancelled: (booking: Booking) => void;
};

export function CancelBookingSection({ booking, onCancelled }: Props) {
  const [isConfirming, setIsConfirming] = useState(false);
  const { cancelBooking, isCancelling, error } = useCancelBooking();

  if (booking.status !== "confirmed") {
    return null;
  }

  if (!booking.isCancellable) {
    return (
      <div className="rounded-2xl border border-border-default bg-elevated p-5 text-sm text-text-muted">
        This booking is non-refundable and can&apos;t be cancelled online.
      </div>
    );
  }

  async function handleConfirm() {
    const cancelled = await cancelBooking(booking.id);
    if (cancelled) {
      onCancelled(cancelled);
    }
  }

  return (
    <div className="rounded-2xl border border-border-default bg-elevated p-5">
      {isConfirming ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-text-primary">Are you sure you want to cancel this booking?</p>
          {error && <p className="text-sm text-error">{error}</p>}
          <div className="flex gap-2">
            <Button
              onClick={handleConfirm}
              disabled={isCancelling}
              className="h-9 rounded-xl border border-error/25 bg-error-dim px-4 font-medium text-error transition-colors hover:bg-error/20 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isCancelling ? "Cancelling…" : "Yes, cancel booking"}
            </Button>
            <Button
              onClick={() => setIsConfirming(false)}
              disabled={isCancelling}
              className="h-9 rounded-xl border border-border-default bg-elevated px-4 font-medium text-text-secondary transition-colors hover:border-border-subtle hover:bg-subtle hover:text-text-primary"
            >
              No, keep it
            </Button>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => setIsConfirming(true)}
          className="h-9 w-fit rounded-xl border border-error/25 bg-error-dim px-4 font-medium text-error transition-colors hover:bg-error/20"
        >
          Cancel Booking
        </Button>
      )}
    </div>
  );
}
