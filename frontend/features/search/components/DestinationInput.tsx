"use client";

import { useState } from "react";
import { ClockIcon, MapPinIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useSearchSuggestions } from "@/features/search/hooks/useSearchSuggestions";

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function DestinationInput({ value, onChange, className }: Props) {
  const [isFocused, setIsFocused] = useState(false);
  const suggestions = useSearchSuggestions(value);
  const showSuggestions = isFocused && suggestions.length > 0;

  function handleSelect(label: string) {
    onChange(label);
    setIsFocused(false);
  }

  return (
    <div
      className={cn(
        "relative m-2 flex flex-col gap-1 rounded-xl border border-border-default bg-subtle px-4 py-2.5 transition-colors focus-within:border-accent-border focus-within:ring-1 focus-within:ring-accent-border",
        className,
      )}
    >
      <label htmlFor="destination" className="text-xs font-medium text-text-muted">
        Destination
      </label>
      <div className="flex items-center gap-2">
        <MapPinIcon className="h-4 w-4 shrink-0 text-text-muted" />
        <Input
          id="destination"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setIsFocused(true)}
          // Deferred so a suggestion's onClick still fires before the list unmounts on blur.
          onBlur={() => setTimeout(() => setIsFocused(false), 150)}
          placeholder="Where are you going?"
          autoComplete="off"
          className="h-auto border-0 bg-transparent p-0 text-sm text-text-primary shadow-none focus-visible:ring-0"
        />
      </div>
      {showSuggestions && (
        <ul className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border-default bg-elevated py-1 shadow-elevated">
          {suggestions.map((suggestion) => (
            <li key={`${suggestion.type}-${suggestion.label}`}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(suggestion.label)}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-text-primary transition-colors hover:bg-subtle"
              >
                {suggestion.type === "recent" ? (
                  <ClockIcon className="h-4 w-4 shrink-0 text-text-muted" />
                ) : (
                  <MapPinIcon className="h-4 w-4 shrink-0 text-text-muted" />
                )}
                {suggestion.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
