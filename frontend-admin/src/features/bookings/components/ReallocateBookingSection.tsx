import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useReallocateBookingMutation } from "@/features/bookings/bookingsApi";
import { useGetRoomTypesQuery } from "@/features/room-types/roomTypesApi";
import type { AdminBookingDetail } from "@/features/bookings/types";

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

type Props = {
  booking: AdminBookingDetail;
};

export function ReallocateBookingSection({ booking }: Props) {
  const { data: roomTypes, isLoading } = useGetRoomTypesQuery(booking.hotelId);
  const [reallocateBooking, { isLoading: isReallocating }] = useReallocateBookingMutation();
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string>("");
  const [isConfirming, setIsConfirming] = useState(false);

  const eligibleRoomTypes = (roomTypes ?? []).filter(
    (roomType) =>
      roomType.id !== booking.roomTypeId && roomType.maxAdults >= booking.adults && roomType.maxKids >= booking.kids,
  );
  const selectedRoomType = eligibleRoomTypes.find((roomType) => roomType.id === selectedRoomTypeId);

  async function handleConfirmReallocate() {
    if (!selectedRoomTypeId) return;
    try {
      await reallocateBooking({ id: booking.id, body: { roomTypeId: selectedRoomTypeId } }).unwrap();
      toast.success("Booking reallocated");
      setIsConfirming(false);
      setSelectedRoomTypeId("");
    } catch (error) {
      toast.error(extractErrorMessage(error, "Could not reallocate booking"));
    }
  }

  return (
    <div className="flex flex-col gap-3 border-t border-border-default pt-4">
      <Label>Reallocate to a different room type</Label>
      {!isLoading && eligibleRoomTypes.length === 0 && (
        <p className="text-sm text-text-muted">No other room type at this hotel fits this booking's party size.</p>
      )}
      {eligibleRoomTypes.length > 0 && (
        <div className="flex flex-wrap items-end gap-3">
          <Select value={selectedRoomTypeId} onValueChange={(value) => setSelectedRoomTypeId(value ?? "")}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a room type" />
            </SelectTrigger>
            <SelectContent>
              {eligibleRoomTypes.map((roomType) => (
                <SelectItem key={roomType.id} value={roomType.id}>
                  {roomType.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            disabled={!selectedRoomTypeId}
            className="h-9 rounded-xl border border-border-default bg-elevated px-4 font-medium text-text-secondary transition-colors hover:border-border-subtle hover:bg-subtle hover:text-text-primary"
            onClick={() => setIsConfirming(true)}
          >
            Reallocate
          </Button>
        </div>
      )}

      <Dialog open={isConfirming} onOpenChange={setIsConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reallocate booking</DialogTitle>
            <DialogDescription>
              Move this booking from "{booking.roomTypeName}" to "{selectedRoomType?.name}"? The total price will be
              recalculated for the new room type's rate on these dates.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="h-9 rounded-xl" onClick={() => setIsConfirming(false)}>
              Go back
            </Button>
            <Button
              disabled={isReallocating}
              onClick={handleConfirmReallocate}
              className="h-9 rounded-xl bg-accent-primary px-4 font-medium text-white transition-colors hover:bg-accent-hover"
            >
              {isReallocating ? "Reallocating..." : "Yes, reallocate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
