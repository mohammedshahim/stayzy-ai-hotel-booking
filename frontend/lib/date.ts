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
