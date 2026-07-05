"use client";

import { MinusIcon, PlusIcon, UsersIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type GuestCounts = {
  adults: number;
  kids: number;
  rooms: number;
};

type Props = {
  value: GuestCounts;
  onChange: (value: GuestCounts) => void;
  className?: string;
};

const FIELDS: { key: keyof GuestCounts; label: string; min: number }[] = [
  { key: "adults", label: "Adults", min: 1 },
  { key: "kids", label: "Kids", min: 0 },
  { key: "rooms", label: "Rooms", min: 1 },
];

export function GuestsRoomsPicker({ value, onChange, className }: Props) {
  function updateCount(key: keyof GuestCounts, delta: number, min: number) {
    onChange({ ...value, [key]: Math.max(min, value[key] + delta) });
  }

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "m-2 flex w-full flex-col gap-1 rounded-xl border border-border-default bg-subtle px-4 py-2.5 text-left transition-colors focus-visible:border-accent-border focus-visible:ring-1 focus-visible:ring-accent-border aria-expanded:border-accent-border aria-expanded:ring-1 aria-expanded:ring-accent-border",
          className,
        )}
      >
        <span className="text-xs font-medium text-text-muted">Guests & Rooms</span>
        <span className="flex items-center gap-2 text-sm text-text-primary">
          <UsersIcon className="h-4 w-4 shrink-0 text-text-muted" />
          {value.adults} adults · {value.kids} kids · {value.rooms} room{value.rooms > 1 ? "s" : ""}
        </span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 border border-border-default bg-elevated p-4 shadow-elevated">
        <div className="flex flex-col gap-4">
          {FIELDS.map((field) => (
            <div key={field.key} className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">{field.label}</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => updateCount(field.key, -1, field.min)}
                  disabled={value[field.key] <= field.min}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-subtle hover:text-text-secondary disabled:pointer-events-none disabled:opacity-40"
                >
                  <MinusIcon className="h-4 w-4" />
                </button>
                <span className="w-4 text-center text-sm text-text-primary">{value[field.key]}</span>
                <button
                  type="button"
                  onClick={() => updateCount(field.key, 1, field.min)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-subtle hover:text-text-secondary"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
