"use client";

import { XIcon } from "lucide-react";

import type { SearchState } from "@/features/search/types";

type Props = {
  state: SearchState;
  onChange: (partial: Partial<SearchState>) => void;
};

type Chip = {
  key: string;
  label: string;
  onRemove: () => void;
};

export function ActiveFilterChips({ state, onChange }: Props) {
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

  for (const amenity of state.amenities) {
    chips.push({
      key: `amenity-${amenity}`,
      label: amenity,
      onRemove: () => onChange({ amenities: state.amenities.filter((value) => value !== amenity) }),
    });
  }

  for (const feature of state.roomFeatures) {
    chips.push({
      key: `feature-${feature}`,
      label: feature,
      onRemove: () =>
        onChange({ roomFeatures: state.roomFeatures.filter((value) => value !== feature) }),
    });
  }

  for (const mealPlan of state.mealPlans) {
    chips.push({
      key: `meal-${mealPlan}`,
      label: mealPlan,
      onRemove: () => onChange({ mealPlans: state.mealPlans.filter((value) => value !== mealPlan) }),
    });
  }

  if (state.freeCancellationOnly) {
    chips.push({
      key: "free-cancellation",
      label: "Free cancellation",
      onRemove: () => onChange({ freeCancellationOnly: false }),
    });
  }

  for (const landmark of state.landmarks) {
    chips.push({
      key: `landmark-${landmark}`,
      label: landmark,
      onRemove: () => onChange({ landmarks: state.landmarks.filter((value) => value !== landmark) }),
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
