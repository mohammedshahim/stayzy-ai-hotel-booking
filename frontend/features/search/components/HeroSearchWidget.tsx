"use client";

import { useState } from "react";
import { SearchIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { DestinationInput } from "@/features/search/components/DestinationInput";
import { DateRangePicker } from "@/features/search/components/DateRangePicker";
import { GuestsRoomsPicker, type GuestCounts } from "@/features/search/components/GuestsRoomsPicker";

export function HeroSearchWidget() {
  const [destination, setDestination] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [guests, setGuests] = useState<GuestCounts>({ adults: 2, kids: 0, rooms: 1 });

  return (
    <div className="rounded-2xl border border-border-default bg-surface p-5 shadow-elevated">
      <div className="flex flex-col lg:flex-row">
        <DestinationInput value={destination} onChange={setDestination} className="lg:flex-1" />
        <DateRangePicker value={dateRange} onChange={setDateRange} className="lg:flex-1" />
        <GuestsRoomsPicker value={guests} onChange={setGuests} className="lg:flex-1" />
      </div>
      <Button
        type="button"
        className="mt-4 h-11 w-full gap-2 rounded-xl bg-accent-primary px-6 font-medium text-white transition-colors hover:bg-accent-hover hover:shadow-accent lg:w-auto"
      >
        <SearchIcon className="h-4 w-4" />
        Search
      </Button>
    </div>
  );
}
