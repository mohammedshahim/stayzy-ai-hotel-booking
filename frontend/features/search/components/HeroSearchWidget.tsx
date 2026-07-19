"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { DestinationInput } from "@/features/search/components/DestinationInput";
import { DateRangePicker } from "@/features/search/components/DateRangePicker";
import { GuestsRoomsPicker, type GuestCounts } from "@/features/search/components/GuestsRoomsPicker";
import { DEFAULT_STATE, serializeSearchState } from "@/features/search/hooks/useSearchState";
import { defaultDateRange, toIsoDates } from "@/lib/date";

const DEFAULT_GUESTS: GuestCounts = {
  adults: DEFAULT_STATE.adults,
  kids: DEFAULT_STATE.kids,
  rooms: DEFAULT_STATE.rooms,
};

export function HeroSearchWidget() {
  const router = useRouter();
  const [destination, setDestination] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(defaultDateRange);
  const [guests, setGuests] = useState<GuestCounts>(DEFAULT_GUESTS);

  function handleSearch() {
    const { checkIn, checkOut } = toIsoDates(dateRange);
    // Serialized through the same helper /search reads back, so the two can never drift.
    const query = serializeSearchState({
      ...DEFAULT_STATE,
      destination,
      checkIn,
      checkOut,
      adults: guests.adults,
      kids: guests.kids,
      rooms: guests.rooms,
    });
    router.push(query ? `/search?${query}` : "/search");
  }

  return (
    <div className="rounded-2xl border border-border-default bg-surface p-5 shadow-elevated">
      <div className="flex flex-col lg:flex-row">
        <DestinationInput value={destination} onChange={setDestination} className="lg:flex-1" />
        <DateRangePicker value={dateRange} onChange={setDateRange} className="lg:flex-1" />
        <GuestsRoomsPicker value={guests} onChange={setGuests} className="lg:flex-1" />
      </div>
      <Button
        type="button"
        onClick={handleSearch}
        className="mt-4 h-11 w-full gap-2 rounded-xl bg-accent-primary px-6 font-medium text-white transition-colors hover:bg-accent-hover hover:shadow-accent lg:w-auto"
      >
        <SearchIcon className="h-4 w-4" />
        Search
      </Button>
    </div>
  );
}
