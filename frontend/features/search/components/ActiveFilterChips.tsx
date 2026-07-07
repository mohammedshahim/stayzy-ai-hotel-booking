"use client";

import { useMemo } from "react";
import { XIcon } from "lucide-react";

import type { SearchCatalogs } from "@/features/search/hooks/useSearchCatalogs";
import type { CatalogOption, SearchState } from "@/features/search/types";

type Props = {
  state: SearchState;
  onChange: (partial: Partial<SearchState>) => void;
  catalogs: SearchCatalogs;
};

type Chip = {
  key: string;
  label: string;
  onRemove: () => void;
};

// Amenities/room features/meal plans are stored as ids in SearchState — this resolves them
// back to display names for the chip label, from the same catalogs SearchPageContent fetches
// once and shares with FilterSidebar (see useSearchCatalogs.ts).
function toNameMap(options: CatalogOption[]): Map<string, string> {
  return new Map(options.map((option) => [option.id, option.name]));
}

export function ActiveFilterChips({ state, onChange, catalogs }: Props) {
  const amenityNames = useMemo(() => toNameMap(catalogs.amenities), [catalogs.amenities]);
  const roomFeatureNames = useMemo(() => toNameMap(catalogs.roomFeatures), [catalogs.roomFeatures]);
  const mealPlanNames = useMemo(() => toNameMap(catalogs.mealPlans), [catalogs.mealPlans]);

  const chips: Chip[] = [];

  if (state.minPrice !== null || state.maxPrice !== null) {
    chips.push({
      key: "price",
      label: `$${state.minPrice ?? 0} – $${state.maxPrice ?? "500+"}`,
      onRemove: () => onChange({ minPrice: null, maxPrice: null }),
    });
  }

  for (const stars of state.starRatings) {
    chips.push({
      key: `stars-${stars}`,
      label: `${stars} star${stars > 1 ? "s" : ""}`,
      onRemove: () => onChange({ starRatings: state.starRatings.filter((value) => value !== stars) }),
    });
  }

  if (state.minGuestRating !== null) {
    chips.push({
      key: "guest-rating",
      label: `${state.minGuestRating}+ guest rating`,
      onRemove: () => onChange({ minGuestRating: null }),
    });
  }

  for (const amenityId of state.amenities) {
    chips.push({
      key: `amenity-${amenityId}`,
      label: amenityNames.get(amenityId) ?? amenityId,
      onRemove: () => onChange({ amenities: state.amenities.filter((value) => value !== amenityId) }),
    });
  }

  for (const featureId of state.roomFeatures) {
    chips.push({
      key: `feature-${featureId}`,
      label: roomFeatureNames.get(featureId) ?? featureId,
      onRemove: () =>
        onChange({ roomFeatures: state.roomFeatures.filter((value) => value !== featureId) }),
    });
  }

  for (const mealPlanId of state.mealPlans) {
    chips.push({
      key: `meal-${mealPlanId}`,
      label: mealPlanNames.get(mealPlanId) ?? mealPlanId,
      onRemove: () => onChange({ mealPlans: state.mealPlans.filter((value) => value !== mealPlanId) }),
    });
  }

  if (state.freeCancellationOnly) {
    chips.push({
      key: "free-cancellation",
      label: "Free cancellation",
      onRemove: () => onChange({ freeCancellationOnly: false }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="mb-2 flex flex-wrap gap-2">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1.5 rounded-full border border-accent-border bg-accent-dim px-2.5 py-1 text-xs text-accent-text"
        >
          {chip.label}
          <button type="button" onClick={chip.onRemove} aria-label={`Remove ${chip.label} filter`}>
            <XIcon className="h-3 w-3 text-accent-text transition-colors hover:text-text-primary" />
          </button>
        </span>
      ))}
    </div>
  );
}
