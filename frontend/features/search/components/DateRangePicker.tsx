"use client";

import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Props = {
  value: DateRange | undefined;
  onChange: (value: DateRange | undefined) => void;
  className?: string;
};

export function DateRangePicker({ value, onChange, className }: Props) {
  const label = value?.from
    ? value.to
      ? `${format(value.from, "MMM d")} – ${format(value.to, "MMM d")}`
      : `${format(value.from, "MMM d")} – Add checkout`
    : "Add dates";

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          // No w-full: as a stretched flex child this already fills the row, and w-full would compute
          // 100% of the parent *before* m-2's margins, overhanging by 16px against DestinationInput.
          "m-2 flex flex-col gap-1 rounded-xl border border-border-default bg-subtle px-4 py-2.5 text-left transition-colors focus-visible:border-accent-border focus-visible:ring-1 focus-visible:ring-accent-border aria-expanded:border-accent-border aria-expanded:ring-1 aria-expanded:ring-accent-border",
          className,
        )}
      >
        <span className="text-xs font-medium text-text-muted">Check-in — Check-out</span>
        <span className="flex items-center gap-2 text-sm text-text-primary">
          <CalendarIcon className="h-4 w-4 shrink-0 text-text-muted" />
          {label}
        </span>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto border border-border-default bg-elevated p-4 shadow-elevated"
      >
        <Calendar
          mode="range"
          numberOfMonths={2}
          selected={value}
          onSelect={onChange}
          disabled={{ before: new Date() }}
        />
      </PopoverContent>
    </Popover>
  );
}
