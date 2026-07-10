"use client";

import { useState } from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { BedDoubleIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/common/EmptyState";
import { DateRangePicker } from "@/features/search/components/DateRangePicker";
import { GuestsRoomsPicker, type GuestCounts } from "@/features/search/components/GuestsRoomsPicker";
import { useRoomTypes } from "@/features/hotel-details/hooks/useRoomTypes";
import { RoomTypeCard } from "@/features/hotel-details/components/RoomTypeCard";
import type { RoomSelectionSearch } from "@/features/hotel-details/types";

type Props = {
  hotelId: string;
  initialSearch: RoomSelectionSearch;
};

function toDateRange(search: RoomSelectionSearch): DateRange | undefined {
  if (!search.checkIn && !search.checkOut) return undefined;
  return {
    from: search.checkIn ? new Date(`${search.checkIn}T00:00:00`) : undefined,
    to: search.checkOut ? new Date(`${search.checkOut}T00:00:00`) : undefined,
  };
}

export function RoomSelectionSection({ hotelId, initialSearch }: Props) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(toDateRange(initialSearch));
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

  const { roomTypes, isLoading } = useRoomTypes(hotelId, search);

  return (
    <div className="rounded-2xl border border-border-default bg-elevated p-5 shadow-card">
      <h2 className="text-lg font-semibold text-text-primary">Choose Your Room</h2>

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
          roomTypes.map((roomType) => <RoomTypeCard key={roomType.id} roomType={roomType} />)
        )}
      </div>
    </div>
  );
}
