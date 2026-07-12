"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { BedDoubleIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/common/EmptyState";
import { DateRangePicker } from "@/features/search/components/DateRangePicker";
import { GuestsRoomsPicker, type GuestCounts } from "@/features/search/components/GuestsRoomsPicker";
import { useRoomTypes } from "@/features/hotel-details/hooks/useRoomTypes";
import { RoomTypeCard } from "@/features/hotel-details/components/RoomTypeCard";
import { authClient } from "@/lib/auth-client";
import { useCreateBooking } from "@/features/booking/hooks/useCreateBooking";
import { defaultDateRange, todayIso, tomorrowIso } from "@/lib/date";
import type { ResolvedRoomSelectionSearch, RoomSelectionSearch } from "@/features/hotel-details/types";

type Props = {
  hotelId: string;
  initialSearch: RoomSelectionSearch;
};

// A still-empty date range defaults to today -> tomorrow (mirroring the backend's own
// fallback) rather than leaving the picker on an ambiguous "Add dates" placeholder — the
// user should always see (and Reserve against) concrete dates, never a silent default.
function toDateRange(search: RoomSelectionSearch): DateRange {
  if (!search.checkIn && !search.checkOut) return defaultDateRange();
  return {
    from: search.checkIn ? new Date(`${search.checkIn}T00:00:00`) : undefined,
    to: search.checkOut ? new Date(`${search.checkOut}T00:00:00`) : undefined,
  };
}

export function RoomSelectionSection({ hotelId, initialSearch }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => toDateRange(initialSearch));
  const [guests, setGuests] = useState<GuestCounts>({
    adults: initialSearch.adults,
    kids: initialSearch.kids,
    rooms: initialSearch.rooms,
  });

  const search: RoomSelectionSearch = {
    checkIn: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : null,
    checkOut: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : null,
    adults: guests.adults,
    kids: guests.kids,
    rooms: guests.rooms,
  };
  const resolvedSearch: ResolvedRoomSelectionSearch = useMemo(
    () => ({
      checkIn: search.checkIn ?? todayIso(),
      checkOut: search.checkOut ?? tomorrowIso(),
      adults: search.adults,
      kids: search.kids,
      rooms: search.rooms,
    }),
    [search.checkIn, search.checkOut, search.adults, search.kids, search.rooms],
  );

  const { roomTypes, isLoading } = useRoomTypes(hotelId, search);

  // Completes the "logged out -> login -> back into the flow" round trip: a Reserve click
  // while logged out redirects here with autoReserve=1 + the original room selection
  // (see RoomTypeCard's buildLoginReturnUrl). Only fires once we can positively confirm a
  // real, verified session — otherwise it silently no-ops rather than risking a redirect
  // loop back through /login, and the user just clicks Reserve again manually.
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const { createBooking, error: autoReserveError } = useCreateBooking();
  const autoReserveAttempted = useRef(false);

  useEffect(() => {
    if (autoReserveAttempted.current || isSessionPending) return;
    if (searchParams.get("autoReserve") !== "1") return;
    const roomTypeId = searchParams.get("roomTypeId");
    if (!roomTypeId || !session?.user.emailVerified) return;

    autoReserveAttempted.current = true;
    createBooking({
      hotelId,
      roomTypeId,
      checkIn: resolvedSearch.checkIn,
      checkOut: resolvedSearch.checkOut,
      adults: resolvedSearch.adults,
      kids: resolvedSearch.kids,
      rooms: resolvedSearch.rooms,
    }).then((booking) => {
      if (booking) router.push(`/checkout/${booking.id}`);
    });
  }, [autoReserveAttempted, createBooking, hotelId, isSessionPending, resolvedSearch, router, searchParams, session]);

  return (
    <div className="rounded-2xl border border-border-default bg-elevated p-5 shadow-card">
      <h2 className="text-lg font-semibold text-text-primary">Choose Your Room</h2>

      {autoReserveError && <p className="mt-2 text-sm text-error">{autoReserveError}</p>}

      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-border-default bg-subtle p-2 sm:flex-row">
        <DateRangePicker value={dateRange} onChange={setDateRange} className="sm:flex-1" />
        <GuestsRoomsPicker value={guests} onChange={setGuests} className="sm:flex-1" />
      </div>

      <div className={cn("mt-5 flex flex-col gap-4", isLoading && "opacity-60")}>
        {roomTypes.length === 0 && !isLoading ? (
          <EmptyState
            icon={BedDoubleIcon}
            heading="No rooms available"
            body="Try different dates or a different number of guests."
          />
        ) : (
          roomTypes.map((roomType) => (
            <RoomTypeCard key={roomType.id} roomType={roomType} hotelId={hotelId} search={resolvedSearch} />
          ))
        )}
      </div>
    </div>
  );
}
