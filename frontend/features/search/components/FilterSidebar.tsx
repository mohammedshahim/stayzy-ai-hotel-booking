"use client";

import { useState, type ReactNode } from "react";
import { StarIcon } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import type { SearchCatalogs } from "@/features/search/hooks/useSearchCatalogs";
import type { SearchState } from "@/features/search/types";

type Props = {
  state: SearchState;
  onChange: (partial: Partial<SearchState>) => void;
  catalogs: SearchCatalogs;
};

const PRICE_MIN = 0;
const PRICE_MAX = 500;
const STAR_RATINGS = [5, 4, 3, 2, 1];
const GUEST_RATING_THRESHOLDS = [
  { value: 9, label: "9+ Excellent" },
  { value: 8, label: "8+ Very Good" },
  { value: 7, label: "7+ Good" },
];

function toggleInArray<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function FilterSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-b border-border-default py-4 last:border-0">
      <p className="mb-3 text-sm font-medium text-text-primary">{title}</p>
      {children}
    </div>
  );
}

function CheckboxRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 py-1 text-sm text-text-secondary">
      <Checkbox checked={checked} onCheckedChange={onCheckedChange} />
      {label}
    </label>
  );
}

function PriceRangeSlider({
  initialRange,
  onCommit,
}: {
  initialRange: number[];
  onCommit: (range: number[]) => void;
}) {
  // Local state gives the thumb instant visual feedback while dragging. The expensive part —
  // committing to URL state, which re-filters the whole result set — only runs once on release
  // (onValueCommitted), instead of on every drag tick. The parent remounts this component (via
  // `key`) whenever the committed range changes for a reason other than this slider's own drag
  // (e.g. a chip removal or "Clear filters"), so no effect is needed to keep the two in sync.
  const [priceRange, setPriceRange] = useState(initialRange);

  return (
    <>
      <Slider
        min={PRICE_MIN}
        max={PRICE_MAX}
        step={10}
        value={priceRange}
        onValueChange={(value) => setPriceRange(value as number[])}
        onValueCommitted={(value) => onCommit(value as number[])}
      />
      <div className="mt-3 flex items-center justify-between text-sm text-text-secondary">
        <span>${priceRange[0]}</span>
        <span>${priceRange[1]}+</span>
      </div>
    </>
  );
}

export function FilterSidebar({ state, onChange, catalogs }: Props) {
  const minPrice = state.minPrice ?? PRICE_MIN;
  const maxPrice = state.maxPrice ?? PRICE_MAX;

  return (
    <aside className="w-full rounded-2xl border border-border-default bg-surface p-5 lg:sticky lg:top-20 lg:h-fit lg:w-72 lg:shrink-0">
      <FilterSection title="Price range">
        <PriceRangeSlider
          key={`${minPrice}-${maxPrice}`}
          initialRange={[minPrice, maxPrice]}
          onCommit={([min, max]) =>
            onChange({
              minPrice: min === PRICE_MIN ? null : min,
              maxPrice: max === PRICE_MAX ? null : max,
            })
          }
        />
      </FilterSection>

      <FilterSection title="Star rating">
        {STAR_RATINGS.map((stars) => (
          <label key={stars} className="flex items-center gap-2 py-1 text-sm text-text-secondary">
            <Checkbox
              checked={state.starRatings.includes(stars)}
              onCheckedChange={() => onChange({ starRatings: toggleInArray(state.starRatings, stars) })}
            />
            <span className="flex items-center gap-0.5">
              {Array.from({ length: stars }, (_, index) => (
                <StarIcon key={index} className="h-3.5 w-3.5 fill-current text-rating-star" />
              ))}
            </span>
          </label>
        ))}
      </FilterSection>

      <FilterSection title="Guest rating">
        {GUEST_RATING_THRESHOLDS.map((threshold) => (
          <CheckboxRow
            key={threshold.value}
            label={threshold.label}
            checked={state.minGuestRating === threshold.value}
            onCheckedChange={(checked) =>
              onChange({ minGuestRating: checked ? threshold.value : null })
            }
          />
        ))}
      </FilterSection>

      <FilterSection title="Amenities">
        {catalogs.amenities.map((amenity) => (
          <CheckboxRow
            key={amenity.id}
            label={amenity.name}
            checked={state.amenities.includes(amenity.id)}
            onCheckedChange={() => onChange({ amenities: toggleInArray(state.amenities, amenity.id) })}
          />
        ))}
      </FilterSection>

      <FilterSection title="Room features">
        {catalogs.roomFeatures.map((feature) => (
          <CheckboxRow
            key={feature.id}
            label={feature.name}
            checked={state.roomFeatures.includes(feature.id)}
            onCheckedChange={() =>
              onChange({ roomFeatures: toggleInArray(state.roomFeatures, feature.id) })
            }
          />
        ))}
      </FilterSection>

      <FilterSection title="Meals">
        {catalogs.mealPlans.map((mealPlan) => (
          <CheckboxRow
            key={mealPlan.id}
            label={mealPlan.name}
            checked={state.mealPlans.includes(mealPlan.id)}
            onCheckedChange={() => onChange({ mealPlans: toggleInArray(state.mealPlans, mealPlan.id) })}
          />
        ))}
      </FilterSection>

      <FilterSection title="Cancellation">
        <CheckboxRow
          label="Free cancellation"
          checked={state.freeCancellationOnly}
          onCheckedChange={(checked) => onChange({ freeCancellationOnly: checked })}
        />
      </FilterSection>
    </aside>
  );
}
