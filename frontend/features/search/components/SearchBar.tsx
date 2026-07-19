"use client";

import { useState } from "react";
import { format } from "date-fns";
import { SearchIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DestinationInput } from "@/features/search/components/DestinationInput";
import { DateRangePicker } from "@/features/search/components/DateRangePicker";
import { GuestsRoomsPicker, type GuestCounts } from "@/features/search/components/GuestsRoomsPicker";
import { toDateRange, toIsoDates } from "@/lib/date";
import type { SearchState } from "@/features/search/types";

type Props = {
  state: SearchState;
  onSearch: (partial: Partial<SearchState>, options?: { history?: "push" | "replace" }) => void;
};

// The six core params this bar owns; filters stay in FilterSidebar.
function signatureOf(state: SearchState): string {
  return [
    state.destination,
    state.checkIn,
    state.checkOut,
    state.adults,
    state.kids,
    state.rooms,
  ].join("|");
}

export function SearchBar({ state, onSearch }: Props) {
  const [destination, setDestination] = useState(state.destination);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    toDateRange(state.checkIn, state.checkOut),
  );
  const [guests, setGuests] = useState<GuestCounts>({
    adults: state.adults,
    kids: state.kids,
    rooms: state.rooms,
  });
  const [isExpanded, setIsExpanded] = useState(false);

  // Edits are held as draft state, so nothing refetches until Search is pressed. That leaves the
  // draft stale whenever the URL moves underneath us (back/forward, a TrendingDestinations link),
  // so reseed on signature change — React's "adjust state during render" pattern, which re-renders
  // before paint instead of flashing the old values the way an effect would.
  const signature = signatureOf(state);
  const [lastSignature, setLastSignature] = useState(signature);
  if (signature !== lastSignature) {
    setLastSignature(signature);
    setDestination(state.destination);
    setDateRange(toDateRange(state.checkIn, state.checkOut));
    setGuests({ adults: state.adults, kids: state.kids, rooms: state.rooms });
  }

  const { checkIn, checkOut } = toIsoDates(dateRange);
  // react-day-picker's first click in range mode returns {from: X, to: X}, so "one day picked" reads
  // as a zero-night stay rather than a half-open range. Both are rejected by the backend.
  const hasIncompleteRange = Boolean(checkIn && (!checkOut || checkOut <= checkIn));

  function handleSearch() {
    onSearch(
      {
        destination,
        checkIn,
        checkOut,
        adults: guests.adults,
        kids: guests.kids,
        rooms: guests.rooms,
      },
      { history: "push" },
    );
    setIsExpanded(false);
  }

  const guestCount = guests.adults + guests.kids;
  const summary = [
    destination || "Anywhere",
    dateRange?.from
      ? dateRange.to
        ? `${format(dateRange.from, "MMM d")} – ${format(dateRange.to, "MMM d")}`
        : format(dateRange.from, "MMM d")
      : "Any dates",
    `${guestCount} ${guestCount === 1 ? "guest" : "guests"}`,
  ].join(" · ");

  return (
    <div className="rounded-2xl border border-border-default bg-surface p-3 shadow-elevated">
      {/* Collapsed representation below sm: keeps results above the fold on phones. */}
      <button
        type="button"
        onClick={() => setIsExpanded((open) => !open)}
        aria-expanded={isExpanded}
        className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm text-text-secondary transition-colors hover:bg-subtle sm:hidden"
      >
        <SearchIcon className="h-4 w-4 shrink-0 text-text-muted" />
        <span className="truncate">{summary}</span>
      </button>

      {/* Grid (not flex) from md: so destination gets 2fr against the other fields' 1fr — a city
          name needs more room than "Aug 10 – Aug 14". md: rather than HeroSearchWidget's lg: because
          a stacked bar on the results page pushes hotels below the fold in a way it doesn't on a hero.
          items-stretch makes the Search button match the fields' height instead of sitting 18px low. */}
      <div
        className={cn(
          // Equal columns at tablet — 2fr there squeezes dates/guests to ~123px and wraps the bar
          // to double height. The destination weighting only pays off once there's room for it.
          "flex-col md:grid md:grid-cols-[1fr_1fr_1fr_auto] md:items-stretch lg:grid-cols-[2fr_1fr_1fr_auto]",
          isExpanded ? "flex" : "hidden sm:flex",
        )}
      >
        <DestinationInput value={destination} onChange={setDestination} />
        <DateRangePicker value={dateRange} onChange={setDateRange} />
        <GuestsRoomsPicker value={guests} onChange={setGuests} />
        <div className="m-2 flex">
          <Button
            type="button"
            onClick={handleSearch}
            disabled={hasIncompleteRange}
            className="h-11 w-full gap-2 rounded-xl bg-accent-primary px-6 font-medium text-white transition-colors hover:bg-accent-hover hover:shadow-accent md:h-auto md:w-auto"
          >
            <SearchIcon className="h-4 w-4" />
            Search
          </Button>
        </div>
      </div>

      {hasIncompleteRange && (
        <p className="px-2 pb-1 text-xs text-text-muted sm:px-4">
          Add a check-out date to search these dates.
        </p>
      )}
    </div>
  );
}
