"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { SearchState, SortOption, ViewMode } from "@/features/search/types";

const DEFAULT_STATE: SearchState = {
  destination: "",
  checkIn: null,
  checkOut: null,
  adults: 2,
  kids: 0,
  rooms: 1,
  minPrice: null,
  maxPrice: null,
  starRatings: [],
  minGuestRating: null,
  amenities: [],
  roomFeatures: [],
  mealPlans: [],
  freeCancellationOnly: false,
  sort: "recommended",
  view: "grid",
  page: 1,
};

const SORT_OPTIONS: SortOption[] = [
  "recommended",
  "price_asc",
  "price_desc",
  "guest_rating",
  "star_rating",
  "distance",
];

const VIEW_MODES: ViewMode[] = ["list", "grid", "map"];

// Changing any of these resets pagination to page 1; only "page" and "view" leave it untouched.
const FILTER_KEYS: (keyof SearchState)[] = [
  "destination",
  "checkIn",
  "checkOut",
  "adults",
  "kids",
  "rooms",
  "minPrice",
  "maxPrice",
  "starRatings",
  "minGuestRating",
  "amenities",
  "roomFeatures",
  "mealPlans",
  "freeCancellationOnly",
  "sort",
];

function parseNumber(value: string | null): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseList(value: string | null): string[] {
  return value ? value.split(",").filter(Boolean) : [];
}

export function parseSearchState(params: URLSearchParams): SearchState {
  const sortParam = params.get("sort");
  const viewParam = params.get("view");
  const page = parseNumber(params.get("page"));

  return {
    destination: params.get("destination") ?? DEFAULT_STATE.destination,
    checkIn: params.get("checkIn"),
    checkOut: params.get("checkOut"),
    adults: parseNumber(params.get("adults")) ?? DEFAULT_STATE.adults,
    kids: parseNumber(params.get("kids")) ?? DEFAULT_STATE.kids,
    rooms: parseNumber(params.get("rooms")) ?? DEFAULT_STATE.rooms,
    minPrice: parseNumber(params.get("minPrice")),
    maxPrice: parseNumber(params.get("maxPrice")),
    starRatings: parseList(params.get("starRatings")).map(Number),
    minGuestRating: parseNumber(params.get("minGuestRating")),
    amenities: parseList(params.get("amenities")),
    roomFeatures: parseList(params.get("roomFeatures")),
    mealPlans: parseList(params.get("mealPlans")),
    freeCancellationOnly: params.get("freeCancellationOnly") === "true",
    sort:
      sortParam && SORT_OPTIONS.includes(sortParam as SortOption)
        ? (sortParam as SortOption)
        : DEFAULT_STATE.sort,
    view:
      viewParam && VIEW_MODES.includes(viewParam as ViewMode)
        ? (viewParam as ViewMode)
        : DEFAULT_STATE.view,
    page: page && page > 0 ? page : DEFAULT_STATE.page,
  };
}

export function serializeSearchState(state: SearchState): string {
  const params = new URLSearchParams();

  if (state.destination) params.set("destination", state.destination);
  if (state.checkIn) params.set("checkIn", state.checkIn);
  if (state.checkOut) params.set("checkOut", state.checkOut);
  if (state.adults !== DEFAULT_STATE.adults) params.set("adults", String(state.adults));
  if (state.kids !== DEFAULT_STATE.kids) params.set("kids", String(state.kids));
  if (state.rooms !== DEFAULT_STATE.rooms) params.set("rooms", String(state.rooms));
  if (state.minPrice !== null) params.set("minPrice", String(state.minPrice));
  if (state.maxPrice !== null) params.set("maxPrice", String(state.maxPrice));
  if (state.starRatings.length) params.set("starRatings", state.starRatings.join(","));
  if (state.minGuestRating !== null) params.set("minGuestRating", String(state.minGuestRating));
  if (state.amenities.length) params.set("amenities", state.amenities.join(","));
  if (state.roomFeatures.length) params.set("roomFeatures", state.roomFeatures.join(","));
  if (state.mealPlans.length) params.set("mealPlans", state.mealPlans.join(","));
  if (state.freeCancellationOnly) params.set("freeCancellationOnly", "true");
  if (state.sort !== DEFAULT_STATE.sort) params.set("sort", state.sort);
  if (state.view !== DEFAULT_STATE.view) params.set("view", state.view);
  if (state.page !== DEFAULT_STATE.page) params.set("page", String(state.page));

  return params.toString();
}

export function useSearchState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const state = parseSearchState(searchParams);

  function update(partial: Partial<SearchState>) {
    const next: SearchState = { ...state, ...partial };
    const touchesFilters = FILTER_KEYS.some((key) => key in partial);
    if (touchesFilters && !("page" in partial)) {
      next.page = 1;
    }

    const query = serializeSearchState(next);
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return { state, update };
}
