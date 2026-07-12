import type { DateRange } from "react-day-picker";

// Mirrors backend/src/utils/date.ts's todayIso()/tomorrowIso() exactly, so a date range
// left untouched by the user resolves to the same default the backend would have applied
// anyway — the picker now shows that default instead of leaving it invisible.
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
