"use client";

import { MapPinIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function DestinationInput({ value, onChange, className }: Props) {
  return (
    <div
      className={cn(
        "m-2 flex flex-col gap-1 rounded-xl border border-border-default bg-subtle px-4 py-2.5 transition-colors focus-within:border-accent-border focus-within:ring-1 focus-within:ring-accent-border",
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
          placeholder="Where are you going?"
          className="h-auto border-0 bg-transparent p-0 text-sm text-text-primary shadow-none focus-visible:ring-0"
        />
      </div>
    </div>
  );
}
