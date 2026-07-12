"use client";

import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { useCreateBooking } from "@/features/booking/hooks/useCreateBooking";
import type { ResolvedRoomSelectionSearch } from "@/features/hotel-details/types";

export type ReserveRoomResult = {
  reserve: (roomTypeId: string, hotelId: string, search: ResolvedRoomSelectionSearch, loginReturnUrl: string) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
  isSessionPending: boolean;
};

// Shared by RoomTypeCard's manual Reserve click and RoomSelectionSection's autoReserve
// effect, so the logged-out/unverified/success branches never drift between the two entry
// points into the same booking-creation flow.
export function useReserveRoom(): ReserveRoomResult {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const { createBooking, isSubmitting, error } = useCreateBooking();

  async function reserve(
    roomTypeId: string,
    hotelId: string,
    search: ResolvedRoomSelectionSearch,
    loginReturnUrl: string,
  ): Promise<void> {
    if (!session) {
      router.push(`/login?returnTo=${encodeURIComponent(loginReturnUrl)}`);
      return;
    }
    if (!session.user.emailVerified) {
      router.push("/verify-email");
      return;
    }

    const booking = await createBooking({
      hotelId,
      roomTypeId,
      checkIn: search.checkIn,
      checkOut: search.checkOut,
      adults: search.adults,
      kids: search.kids,
      rooms: search.rooms,
    });
    if (booking) router.push(`/checkout/${booking.id}`);
  }

  return { reserve, isSubmitting, error, isSessionPending };
}
