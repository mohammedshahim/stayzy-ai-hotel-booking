"use client";

import { useMemo } from "react";

import { getDiscountedPrice, MOCK_HOTELS, type MockHotel } from "@/features/search/data/mock-hotels";
import type { SearchState } from "@/features/search/types";

export const RESULTS_PER_PAGE = 9;

function matchesDestination(hotel: MockHotel, destination: string): boolean {
  const query = destination.trim().toLowerCase();
  if (!query) return true;
  return hotel.city.toLowerCase().includes(query) || hotel.country.toLowerCase().includes(query);
}

function matchesFilters(hotel: MockHotel, state: SearchState): boolean {
  const price = getDiscountedPrice(hotel);

  if (state.minPrice !== null && price < state.minPrice) return false;
  if (state.maxPrice !== null && price > state.maxPrice) return false;
  if (state.starRatings.length > 0 && !state.starRatings.includes(hotel.starRating)) return false;
  if (state.minGuestRating !== null && hotel.guestRating < state.minGuestRating) return false;
  if (state.amenities.length > 0 && !state.amenities.every((amenity) => hotel.amenities.includes(amenity))) {
    return false;
  }
  if (
    state.roomFeatures.length > 0 &&
    !state.roomFeatures.every((feature) => hotel.roomFeatures.includes(feature))
  ) {
    return false;
  }
  if (state.mealPlans.length > 0 && !state.mealPlans.includes(hotel.mealPlan)) return false;
  if (state.freeCancellationOnly && !hotel.freeCancellation) return false;
  if (state.landmarks.length > 0 && !state.landmarks.includes(hotel.landmark)) return false;

  return true;
}

function sortHotels(hotels: MockHotel[], sort: SearchState["sort"]): MockHotel[] {
  const sorted = [...hotels];

  switch (sort) {
    case "price_asc":
      return sorted.sort((a, b) => getDiscountedPrice(a) - getDiscountedPrice(b));
    case "price_desc":
      return sorted.sort((a, b) => getDiscountedPrice(b) - getDiscountedPrice(a));
    case "guest_rating":
      return sorted.sort((a, b) => b.guestRating - a.guestRating);
    case "star_rating":
      return sorted.sort((a, b) => b.starRating - a.starRating);
    case "distance":
      return sorted.sort((a, b) => a.distanceFromCenterKm - b.distanceFromCenterKm);
    case "recommended":
    default:
      return sorted;
  }
}

export type SearchResults = {
  results: MockHotel[];
  totalResults: number;
  totalPages: number;
  currentPage: number;
  isEmpty: boolean;
};

export function useSearchResults(state: SearchState): SearchResults {
  return useMemo(() => {
    const matched = MOCK_HOTELS.filter(
      (hotel) => matchesDestination(hotel, state.destination) && matchesFilters(hotel, state),
    );
    const sorted = sortHotels(matched, state.sort);
    const totalResults = sorted.length;

    // Map view shows every matched pin/card at once — pagination only applies to List/Grid.
    if (state.view === "map") {
      return { results: sorted, totalResults, totalPages: 1, currentPage: 1, isEmpty: totalResults === 0 };
    }

    const totalPages = Math.max(1, Math.ceil(totalResults / RESULTS_PER_PAGE));
    const currentPage = Math.min(state.page, totalPages);
    const startIndex = (currentPage - 1) * RESULTS_PER_PAGE;

    return {
      results: sorted.slice(startIndex, startIndex + RESULTS_PER_PAGE),
      totalResults,
      totalPages,
      currentPage,
      isEmpty: totalResults === 0,
    };
  }, [state]);
}
