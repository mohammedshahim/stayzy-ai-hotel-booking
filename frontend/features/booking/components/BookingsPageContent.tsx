"use client";

import Link from "next/link";
import { CalendarXIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { useBookingsList } from "@/features/booking/hooks/useBookingsList";
import { BookingListCard } from "@/features/booking/components/BookingListCard";
import { BookingsListSkeleton } from "@/features/booking/components/BookingsListSkeleton";

export function BookingsPageContent() {
  const { bookings, isLoading } = useBookingsList();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-8">
      <h1 className="text-2xl font-semibold text-text-primary sm:text-3xl">My Bookings</h1>

      {isLoading ? (
        <BookingsListSkeleton />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={CalendarXIcon}
          heading="No bookings yet"
          body="Hotels you book will show up here."
          action={
            <Button
              render={<Link href="/search" />}
              nativeButton={false}
              className="h-9 rounded-xl border border-border-default bg-elevated px-4 font-medium text-text-secondary transition-colors hover:border-border-subtle hover:bg-subtle hover:text-text-primary"
            >
              Browse hotels
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {bookings.map((booking) => (
            <BookingListCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  );
}
