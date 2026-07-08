"use client";

import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ClockIcon, MapPinIcon, UsersIcon } from "lucide-react";

import { useRecentSearches, type RecentSearchSummary } from "@/features/recent-searches/hooks/useRecentSearches";

const DEFAULT_GUESTS = { adults: 2, kids: 0, rooms: 1 };

export function RecentSearches() {
  const router = useRouter();
  const recentSearches = useRecentSearches();

  if (recentSearches.length === 0) return null;

  function handleSelect(search: RecentSearchSummary) {
    const params = new URLSearchParams();
    params.set("destination", search.destinationQuery);
    params.set("checkIn", search.checkIn);
    params.set("checkOut", search.checkOut);
    if (search.adults !== DEFAULT_GUESTS.adults) params.set("adults", String(search.adults));
    if (search.kids !== DEFAULT_GUESTS.kids) params.set("kids", String(search.kids));
    if (search.rooms !== DEFAULT_GUESTS.rooms) params.set("rooms", String(search.rooms));
    router.push(`/search?${params.toString()}`);
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-14">
      <span className="text-sm text-accent-text">Welcome back</span>
      <h2 className="mt-1 text-3xl font-semibold text-text-primary">Recent Searches</h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {recentSearches.map((search) => (
          <button
            key={`${search.destinationQuery}-${search.checkIn}-${search.checkOut}-${search.adults}-${search.kids}-${search.rooms}`}
            type="button"
            onClick={() => handleSelect(search)}
            className="flex flex-col gap-2 rounded-2xl border border-border-default bg-surface p-4 text-left transition-colors hover:border-accent-border hover:shadow-accent"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <MapPinIcon className="h-4 w-4 shrink-0 text-text-muted" />
              {search.destinationQuery}
            </span>
            <span className="flex items-center gap-2 text-xs text-text-muted">
              <ClockIcon className="h-3.5 w-3.5 shrink-0" />
              {format(parseISO(search.checkIn), "MMM d")} – {format(parseISO(search.checkOut), "MMM d")}
            </span>
            <span className="flex items-center gap-2 text-xs text-text-muted">
              <UsersIcon className="h-3.5 w-3.5 shrink-0" />
              {search.adults} adults · {search.kids} kids · {search.rooms} room{search.rooms > 1 ? "s" : ""}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
