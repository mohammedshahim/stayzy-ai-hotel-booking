"use client";

import { useState } from "react";
import { SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { useCompareSelection } from "@/features/compare/hooks/useCompareSelection";
import { useCompareSuggestions } from "@/features/compare/hooks/useCompareSuggestions";

export function CompareSearchBox() {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const { ids, isFull, add } = useCompareSelection();
  const suggestions = useCompareSuggestions(query, ids);
  const showSuggestions = isFocused && !isFull && suggestions.length > 0;

  function handleSelect(hotelId: string) {
    add(hotelId);
    setQuery("");
    setIsFocused(false);
  }

  return (
    <div className="relative flex flex-col gap-1 rounded-xl border border-border-default bg-subtle px-4 py-2.5 transition-colors focus-within:border-accent-border focus-within:ring-1 focus-within:ring-accent-border">
      <label htmlFor="compare-search" className="text-xs font-medium text-text-muted">
        Add a hotel to compare
      </label>
      <div className="flex items-center gap-2">
        <SearchIcon className="h-4 w-4 shrink-0 text-text-muted" />
        <Input
          id="compare-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setIsFocused(true)}
          // Deferred so a suggestion's onClick still fires before the list unmounts on blur.
          onBlur={() => setTimeout(() => setIsFocused(false), 150)}
          placeholder={isFull ? "Remove a hotel to add another" : "Search by hotel name or city"}
          disabled={isFull}
          autoComplete="off"
          className="h-auto border-0 bg-transparent p-0 text-sm text-text-primary shadow-none focus-visible:ring-0"
        />
      </div>
      {showSuggestions && (
        <ul className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border-default bg-elevated py-1 shadow-elevated">
          {suggestions.map((suggestion) => (
            <li key={suggestion.id}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(suggestion.id)}
                className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-text-primary transition-colors hover:bg-subtle"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- S3-hosted photos, no next/image domain configured yet */}
                <img
                  src={suggestion.mainImageUrl ?? ""}
                  alt={suggestion.name}
                  className="h-9 w-9 shrink-0 rounded-lg object-cover"
                />
                <span className="flex flex-col">
                  <span>{suggestion.name}</span>
                  <span className="text-xs text-text-muted">
                    {suggestion.city}, {suggestion.country}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
