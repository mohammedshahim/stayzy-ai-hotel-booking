"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { SearchIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { DestinationInput } from "@/features/search/components/DestinationInput";
import { DateRangePicker } from "@/features/search/components/DateRangePicker";
import { GuestsRoomsPicker, type GuestCounts } from "@/features/search/components/GuestsRoomsPicker";

const DEFAULT_GUESTS: GuestCounts = { adults: 2, kids: 0, rooms: 1 };

export function HeroSearchWidget() {
  const router = useRouter();
  const [destination, setDestination] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [guests, setGuests] = useState<GuestCounts>(DEFAULT_GUESTS);

  function handleSearch() {
    const params = new URLSearchParams();
    if (destination) params.set("destination", destination);
    if (dateRange?.from) params.set("checkIn", format(dateRange.from, "yyyy-MM-dd"));
    if (dateRange?.to) params.set("checkOut", format(dateRange.to, "yyyy-MM-dd"));
    if (guests.adults !== DEFAULT_GUESTS.adults) params.set("adults", String(guests.adults));
    if (guests.kids !== DEFAULT_GUESTS.kids) params.set("kids", String(guests.kids));
    if (guests.rooms !== DEFAULT_GUESTS.rooms) params.set("rooms", String(guests.rooms));

    const query = params.toString();
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
