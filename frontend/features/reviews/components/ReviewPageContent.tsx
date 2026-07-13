"use client";

import { ClockIcon, SearchXIcon } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { useBookingSummary } from "@/features/booking/hooks/useBookingSummary";
import { ReviewForm } from "@/features/reviews/components/ReviewForm";
import { useOwnReview } from "@/features/reviews/hooks/useOwnReview";

type Props = {
  bookingId: string;
};

export function ReviewPageContent({ bookingId }: Props) {
  const { booking, isLoading: isLoadingBooking } = useBookingSummary(bookingId);
  const { review, isLoading: isLoadingReview } = useOwnReview(bookingId, Boolean(booking?.review));

  if (isLoadingBooking || isLoadingReview) {
    return <p className="py-16 text-center text-sm text-text-muted">Loading…</p>;
  }

  if (!booking) {
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

  if (booking.status !== "completed") {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <EmptyState icon={ClockIcon} heading="This booking can't be reviewed yet" body="Only completed stays can be reviewed." />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
      <h1 className="text-2xl font-semibold text-text-primary">{review ? "Edit your review" : "Leave a review"}</h1>
      <ReviewForm bookingId={bookingId} existingReview={review} />
    </div>
  );
}
