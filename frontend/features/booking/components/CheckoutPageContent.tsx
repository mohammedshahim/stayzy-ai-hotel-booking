"use client";

import { SearchXIcon } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { useBookingSummary } from "@/features/booking/hooks/useBookingSummary";
import { BookingSummaryCard } from "@/features/booking/components/BookingSummaryCard";
import { CheckoutForm } from "@/features/booking/components/CheckoutForm";
import { CheckoutSkeleton } from "@/features/booking/components/CheckoutSkeleton";

type Props = {
  bookingId: string;
};

export function CheckoutPageContent({ bookingId }: Props) {
  const { booking, isLoading } = useBookingSummary(bookingId);

  if (isLoading) {
    return <CheckoutSkeleton />;
  }

  if (!booking) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16">
        <EmptyState
          icon={SearchXIcon}
          heading="Booking not found"
          body="This booking may not exist, or it doesn't belong to your account."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-text-primary">Checkout</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="overflow-hidden rounded-2xl border border-border-default bg-surface">
          <div className="border-b border-border-default px-5 py-4">
            <h2 className="text-lg font-semibold text-text-primary">Payment</h2>
          </div>
          <CheckoutForm bookingId={bookingId} />
        </div>

        <div className="lg:sticky lg:top-20 lg:h-fit">
          <BookingSummaryCard booking={booking} />
        </div>
      </div>
    </div>
  );
}
