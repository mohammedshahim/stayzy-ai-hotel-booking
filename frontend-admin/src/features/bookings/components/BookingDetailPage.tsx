import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookingStatusBadge } from "@/features/bookings/components/BookingStatusBadge";
import { ReallocateBookingSection } from "@/features/bookings/components/ReallocateBookingSection";
import { useCancelBookingMutation, useConfirmBookingMutation, useGetBookingQuery } from "@/features/bookings/bookingsApi";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (
    error &&
    typeof error === "object" &&
    "data" in error &&
    error.data &&
    typeof error.data === "object" &&
    "error" in error.data &&
    typeof error.data.error === "string"
  ) {
    return error.data.error;
  }
  return fallback;
}

type PendingAction = "confirm" | "cancel" | null;

export function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: booking, isLoading, isError } = useGetBookingQuery(id ?? "", { skip: !id });
  const [confirmBooking, { isLoading: isConfirming }] = useConfirmBookingMutation();
  const [cancelBooking, { isLoading: isCancelling }] = useCancelBookingMutation();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  async function handleConfirmDialog() {
    if (!id || !pendingAction) return;
    try {
      if (pendingAction === "confirm") {
        await confirmBooking(id).unwrap();
        toast.success("Booking confirmed");
      } else {
        await cancelBooking(id).unwrap();
        toast.success("Booking cancelled");
      }
      setPendingAction(null);
    } catch (error) {
      toast.error(extractErrorMessage(error, "Something went wrong"));
    }
  }

  if (isLoading) {
    return <p className="text-sm text-text-muted">Loading booking...</p>;
  }

  if (isError || !booking) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <AlertTriangle className="size-10 text-error" />
        <p className="text-base font-medium text-text-muted">Couldn't load this booking</p>
        <Link to="/bookings" className="text-sm text-accent-primary hover:underline">
          Back to bookings
        </Link>
      </div>
    );
  }

  const isActionBusy = isConfirming || isCancelling;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link to="/bookings" className="flex w-fit items-center gap-1.5 text-sm text-text-muted hover:text-text-primary">
          <ArrowLeft className="size-4" />
          Back to bookings
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-text-primary">Booking Details</h1>
          <BookingStatusBadge status={booking.status} />
        </div>
      </div>

      <div className="grid gap-4 rounded-2xl border border-border-default bg-surface p-6 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium tracking-wide text-text-muted uppercase">Guest</span>
          <span className="text-sm font-medium text-text-primary">{booking.guestName}</span>
          <span className="text-xs text-text-faint">{booking.guestEmail}</span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium tracking-wide text-text-muted uppercase">Hotel</span>
          <div className="flex items-center gap-3">
            <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-subtle">
              {booking.hotelMainImageUrl && (
                <img src={booking.hotelMainImageUrl} alt="" className="size-full object-cover" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-text-primary">{booking.hotelName}</span>
              <span className="text-xs text-text-faint">
                {booking.hotelCity}, {booking.hotelCountry}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium tracking-wide text-text-muted uppercase">Room type</span>
          <span className="text-sm text-text-primary">{booking.roomTypeName}</span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium tracking-wide text-text-muted uppercase">Dates</span>
          <span className="text-sm text-text-primary">
            {formatDate(booking.checkIn)} – {formatDate(booking.checkOut)}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium tracking-wide text-text-muted uppercase">Guests</span>
          <span className="text-sm text-text-primary">
            {booking.adults} adult{booking.adults === 1 ? "" : "s"}
            {booking.kids > 0 ? `, ${booking.kids} kid${booking.kids === 1 ? "" : "s"}` : ""} · {booking.roomsBooked} room
            {booking.roomsBooked === 1 ? "" : "s"}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium tracking-wide text-text-muted uppercase">Total price</span>
          <span className="text-sm text-text-primary">${booking.totalPrice}</span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium tracking-wide text-text-muted uppercase">Booked on</span>
          <span className="text-sm text-text-primary">{formatDate(booking.createdAt)}</span>
        </div>
      </div>

      {(booking.status === "pending_payment" || booking.status === "confirmed") && (
        <div className="flex flex-col gap-4 rounded-2xl border border-border-default bg-surface p-6">
          <h2 className="text-lg font-semibold text-text-primary">Actions</h2>
          <div className="flex flex-wrap gap-3">
            {booking.status === "pending_payment" && (
              <Button
                className="h-9 rounded-xl border border-success/25 bg-success-dim px-4 font-medium text-success transition-colors hover:bg-success/20"
                onClick={() => setPendingAction("confirm")}
              >
                Confirm booking
              </Button>
            )}
            <Button
              className="h-9 rounded-xl border border-error/25 bg-error-dim px-4 font-medium text-error transition-colors hover:bg-error/20"
              onClick={() => setPendingAction("cancel")}
            >
              Cancel booking
            </Button>
          </div>

          {booking.status === "confirmed" && <ReallocateBookingSection booking={booking} />}
        </div>
      )}

      <Dialog open={pendingAction !== null} onOpenChange={(open) => !open && setPendingAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{pendingAction === "confirm" ? "Confirm booking" : "Cancel booking"}</DialogTitle>
            <DialogDescription>
              {pendingAction === "confirm"
                ? "This manually marks the booking as confirmed without going through Stripe — use this for offline or cash payments."
                : "Are you sure you want to cancel this booking? This can't be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="h-9 rounded-xl" onClick={() => setPendingAction(null)}>
              Go back
            </Button>
            <Button
              disabled={isActionBusy}
              onClick={handleConfirmDialog}
              className={
                pendingAction === "confirm"
                  ? "h-9 rounded-xl border border-success/25 bg-success-dim px-4 text-success transition-colors hover:bg-success/20"
                  : "h-9 rounded-xl border border-error/25 bg-error-dim px-4 text-error transition-colors hover:bg-error/20"
              }
            >
              {pendingAction === "confirm" ? "Yes, confirm booking" : "Yes, cancel booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
