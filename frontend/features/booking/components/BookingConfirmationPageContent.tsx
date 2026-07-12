"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2Icon, Loader2Icon, SearchXIcon, XCircleIcon } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { usePollBookingStatus } from "@/features/booking/hooks/usePollBookingStatus";
import { BookingSummaryCard } from "@/features/booking/components/BookingSummaryCard";

type Props = {
  bookingId: string;
};

export function BookingConfirmationPageContent({ bookingId }: Props) {
  const searchParams = useSearchParams();
  // Stripe appends this after a full redirect confirmation — "failed" only happens for
  // payment methods that redirect away and report failure on return (e.g. bank redirects).
  // A card decline never gets here — it stays on the checkout page as an inline error.
  const redirectFailed = searchParams.get("redirect_status") === "failed";

  const { booking, isPolling } = usePollBookingStatus(bookingId);

  if (redirectFailed) {
    return <FailureState />;
  }

  if (isPolling) {
    return <ProcessingState message="Confirming your payment…" />;
  }

  if (!booking) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <EmptyState
          icon={SearchXIcon}
          heading="Booking not found"
          body="This booking may not exist, may not belong to your account, or we're having trouble loading it right now."
        />
      </div>
    );
  }

  if (booking.status === "confirmed") {
    return (
      <div className="mx-auto max-w-2xl px-6 py-8">
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <CheckCircle2Icon className="h-12 w-12 text-success" strokeWidth={1.5} />
          <h1 className="text-2xl font-semibold text-text-primary">Booking confirmed</h1>
          <p className="text-sm text-text-muted">A confirmation has been sent to your email.</p>
        </div>
        <BookingSummaryCard booking={booking} />
        <div className="mt-6 flex justify-center">
          <Link href="/">
            <Button
              type="button"
              className="h-10 rounded-xl border border-border-default bg-elevated px-6 font-medium text-text-secondary transition-colors hover:border-border-subtle hover:bg-subtle hover:text-text-primary"
            >
              Browse more hotels
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (booking.status === "failed" || booking.status === "cancelled") {
    return <FailureState />;
  }

  // Still pending_payment after MAX_ATTEMPTS — the webhook (Feature 22) hasn't landed
  // yet, but this isn't an error, just slower than usual.
  return <ProcessingState message="This is taking longer than usual — your booking will confirm shortly." />;
}

function ProcessingState({ message }: { message: string }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 px-6 py-24 text-center">
      <Loader2Icon className="h-10 w-10 animate-spin text-text-faint" strokeWidth={1.5} />
      <p className="text-sm text-text-muted">{message}</p>
    </div>
  );
}

function FailureState() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 px-6 py-24 text-center">
      <XCircleIcon className="h-12 w-12 text-error" strokeWidth={1.5} />
      <h1 className="text-xl font-semibold text-text-primary">Payment failed</h1>
      <p className="text-sm text-text-muted">Your payment did not go through. No charge was made.</p>
      <Link href="/">
        <Button
          type="button"
          className="mt-2 h-10 rounded-xl border border-border-default bg-elevated px-6 font-medium text-text-secondary transition-colors hover:border-border-subtle hover:bg-subtle hover:text-text-primary"
        >
          Back to home
        </Button>
      </Link>
    </div>
  );
}
