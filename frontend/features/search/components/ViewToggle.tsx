"use client";

import { LayoutGridIcon, LayoutListIcon, MapIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ViewMode } from "@/features/search/types";

type Props = {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
};

const VIEW_OPTIONS: { value: ViewMode; icon: typeof LayoutGridIcon; label: string }[] = [
  { value: "list", icon: LayoutListIcon, label: "List view" },
  { value: "grid", icon: LayoutGridIcon, label: "Grid view" },
  { value: "map", icon: MapIcon, label: "Map view" },
];

export function ViewToggle({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-border-default bg-subtle p-1">
      {VIEW_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-label={option.label}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
            value === option.value
              ? "bg-elevated text-accent-text shadow-card"
              : "text-text-muted hover:text-text-secondary",
          )}
        >
          <option.icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
