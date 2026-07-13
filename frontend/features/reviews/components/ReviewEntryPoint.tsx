import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { BookingSummary } from "@/features/booking/types";

type Props = {
  booking: BookingSummary;
};

export function ReviewEntryPoint({ booking }: Props) {
  if (booking.status !== "completed") {
    return null;
  }

  return (
    <Button
      render={<Link href={`/bookings/${booking.id}/review`} />}
      nativeButton={false}
      className="h-9 w-fit rounded-xl border border-border-default bg-elevated px-4 font-medium text-text-secondary transition-colors hover:border-border-subtle hover:bg-subtle hover:text-text-primary"
    >
      {booking.review ? "Edit your review" : "Leave a review"}
    </Button>
  );
}
