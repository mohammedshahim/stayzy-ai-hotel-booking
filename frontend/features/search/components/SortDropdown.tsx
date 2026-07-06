"use client";

import type { SortOption } from "@/features/search/types";

type Props = {
  value: SortOption;
  onChange: (value: SortOption) => void;
};

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "price_asc", label: "Price low to high" },
  { value: "price_desc", label: "Price high to low" },
  { value: "guest_rating", label: "Guest rating" },
  { value: "star_rating", label: "Star rating" },
  { value: "distance", label: "Distance from center" },
];

export function SortDropdown({ value, onChange }: Props) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as SortOption)}
      className="h-10 rounded-xl border border-border-default bg-subtle px-3 text-sm text-text-primary transition-colors outline-none focus-visible:border-accent-border focus-visible:ring-1 focus-visible:ring-accent-border"
    >
      {SORT_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
