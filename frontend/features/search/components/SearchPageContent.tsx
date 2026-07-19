"use client";

import { useState } from "react";
import { SearchXIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { Pagination } from "@/components/common/Pagination";
import { ActiveFilterChips } from "@/features/search/components/ActiveFilterChips";
import { FilterSidebar } from "@/features/search/components/FilterSidebar";
import { HotelCard } from "@/features/search/components/HotelCard";
import { MapView } from "@/features/search/components/MapView";
import { SearchBar } from "@/features/search/components/SearchBar";
import { SearchResultsSkeleton } from "@/features/search/components/SearchResultsSkeleton";
import { SortDropdown } from "@/features/search/components/SortDropdown";
import { ViewToggle } from "@/features/search/components/ViewToggle";
import { useFavoriteHotelIds } from "@/features/favorites/hooks/useFavoriteHotelIds";
import { useSearchCatalogs } from "@/features/search/hooks/useSearchCatalogs";
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
};

export function SearchPageContent() {
  const { state, update } = useSearchState();
  const { results, totalResults, totalPages, currentPage, isEmpty, isLoading } = useSearchResults(state);
  const catalogs = useSearchCatalogs();
  const { favoritedIds, toggleFavorite } = useFavoriteHotelIds();

  // Lifted above MapView so "View on map" from Grid/List can switch the view and set the centered hotel.
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);

  function handleLocate(hotelId: string) {
    setSelectedHotelId(hotelId);
    update({ view: "map" });
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8">
      <SearchBar state={state} onSearch={update} />

      <div className="flex flex-col gap-6 lg:flex-row">
        <FilterSidebar state={state} onChange={update} catalogs={catalogs} />

        <div className="flex flex-1 flex-col gap-4">
          <ActiveFilterChips state={state} onChange={update} catalogs={catalogs} />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-text-secondary">
              {totalResults} {totalResults === 1 ? "hotel" : "hotels"} found
            </p>
            <div className="flex items-center gap-3">
              <SortDropdown value={state.sort} onChange={(sort) => update({ sort })} />
              <ViewToggle value={state.view} onChange={(view) => update({ view })} />
            </div>
          </div>

          {isLoading && isEmpty ? (
            <SearchResultsSkeleton view={state.view} />
          ) : isEmpty ? (
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
          ) : (
            <div className={cn("transition-opacity", isLoading && "opacity-60")}>
              {state.view === "map" ? (
                <MapView
                  hotels={results}
                  selectedHotelId={selectedHotelId}
                  onSelectHotel={setSelectedHotelId}
                  favoritedIds={favoritedIds}
                  onToggleFavorite={toggleFavorite}
                />
              ) : (
                <div
                  className={cn(
                    state.view === "grid" ? "grid gap-5 sm:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-4",
                  )}
                >
                  {results.map((hotel) => (
                    <HotelCard
                      key={hotel.id}
                      hotel={hotel}
                      variant={state.view === "grid" ? "grid" : "list"}
                      onLocate={() => handleLocate(hotel.id)}
                      isFavorited={favoritedIds.has(hotel.id)}
                      onToggleFavorite={() => toggleFavorite(hotel.id)}
                    />
                  ))}
                </div>
              )}
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
    </div>
  );
}
