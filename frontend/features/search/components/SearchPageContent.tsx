"use client";

import { SearchXIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { Pagination } from "@/components/common/Pagination";
import { ActiveFilterChips } from "@/features/search/components/ActiveFilterChips";
import { FilterSidebar } from "@/features/search/components/FilterSidebar";
import { HotelCard } from "@/features/search/components/HotelCard";
import { MapView } from "@/features/search/components/MapView";
import { SortDropdown } from "@/features/search/components/SortDropdown";
import { ViewToggle } from "@/features/search/components/ViewToggle";
import { useSearchResults } from "@/features/search/hooks/useSearchResults";
import { useSearchState } from "@/features/search/hooks/useSearchState";
import type { SearchState } from "@/features/search/types";

const EMPTY_FILTERS: Partial<SearchState> = {
  minPrice: null,
  maxPrice: null,
  starRatings: [],
  minGuestRating: null,
  amenities: [],
  roomFeatures: [],
  mealPlans: [],
  freeCancellationOnly: false,
  landmarks: [],
};

export function SearchPageContent() {
  const { state, update } = useSearchState();
  const { results, totalResults, totalPages, currentPage, isEmpty } = useSearchResults(state);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 lg:flex-row">
      <FilterSidebar state={state} onChange={update} />

      <div className="flex flex-1 flex-col gap-4">
        <ActiveFilterChips state={state} onChange={update} />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-text-secondary">
            {totalResults} {totalResults === 1 ? "hotel" : "hotels"} found
            {state.destination && ` in ${state.destination}`}
          </p>
          <div className="flex items-center gap-3">
            <SortDropdown value={state.sort} onChange={(sort) => update({ sort })} />
            <ViewToggle value={state.view} onChange={(view) => update({ view })} />
          </div>
        </div>

        {isEmpty ? (
          <EmptyState
            icon={SearchXIcon}
            heading="No hotels match these filters"
            body="Try relaxing a filter or two to see more results."
            action={
              <Button
                onClick={() => update(EMPTY_FILTERS)}
                className="h-9 rounded-xl border border-border-default bg-elevated px-4 font-medium text-text-secondary transition-colors hover:border-border-subtle hover:bg-subtle hover:text-text-primary"
              >
                Clear filters
              </Button>
            }
          />
        ) : state.view === "map" ? (
          <MapView hotels={results} />
        ) : (
          <div
            className={cn(
              state.view === "grid" ? "grid gap-5 sm:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-4",
            )}
          >
            {results.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} variant={state.view === "grid" ? "grid" : "list"} />
            ))}
          </div>
        )}

        {state.view !== "map" && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => update({ page })}
          />
        )}
      </div>
    </div>
  );
}
