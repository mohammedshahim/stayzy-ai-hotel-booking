import { format } from "date-fns";
import type { DateRange } from "react-day-picker";

// Mirrors backend/src/utils/date.ts's todayIso()/tomorrowIso() so an untouched range matches the backend's default.
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function tomorrowIso(): string {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function defaultDateRange(): DateRange {
  return {
    from: new Date(`${todayIso()}T00:00:00`),
    to: new Date(`${tomorrowIso()}T00:00:00`),
  };
}

// Bridges SearchState's ISO date strings and DateRangePicker's Date objects.
// The explicit T00:00:00 keeps these local-midnight, matching defaultDateRange() —
// bare new Date("2026-03-04") would parse as UTC and shift a day in negative offsets.
export function toDateRange(checkIn: string | null, checkOut: string | null): DateRange | undefined {
  if (!checkIn) return undefined;
  return {
    from: new Date(`${checkIn}T00:00:00`),
    to: checkOut ? new Date(`${checkOut}T00:00:00`) : undefined,
  };
}

export function toIsoDates(range: DateRange | undefined): {
  checkIn: string | null;
  checkOut: string | null;
} {
  return {
    checkIn: range?.from ? format(range.from, "yyyy-MM-dd") : null,
    checkOut: range?.to ? format(range.to, "yyyy-MM-dd") : null,
  };
}
