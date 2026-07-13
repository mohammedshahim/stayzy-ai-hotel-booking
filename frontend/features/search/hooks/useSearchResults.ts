"use client";

import { useEffect, useState } from "react";

import { apiClient } from "@/lib/api-client";
import { serializeSearchState } from "@/features/search/hooks/useSearchState";
import type { SearchApiResponse, SearchResultHotel, SearchState } from "@/features/search/types";

export const RESULTS_PER_PAGE = 9;
// Capped at 100 to match GET /search's pageSize ceiling (backend/src/types/search.schemas.ts).
const MAP_VIEW_PAGE_SIZE = 100;

export type SearchResults = {
  results: SearchResultHotel[];
  totalResults: number;
  totalPages: number;
  currentPage: number;
  isEmpty: boolean;
  isLoading: boolean;
};

type FetchedData = {
  results: SearchResultHotel[];
  totalResults: number;
  totalPages: number;
  currentPage: number;
  isEmpty: boolean;
  // The query this data was fetched for — `null` until the first fetch resolves, so isLoading below reads true on mount instead of matching an accidental empty string.
  forQuery: string | null;
};

const INITIAL_DATA: FetchedData = {
  results: [],
  totalResults: 0,
  totalPages: 1,
  currentPage: 1,
  isEmpty: true,
  forQuery: null,
};

export function useSearchResults(state: SearchState): SearchResults {
  const [data, setData] = useState<FetchedData>(INITIAL_DATA);
  // Map view has no pagination and shows every result, so force page 1 regardless of Grid/List's page.
  const effectiveState = state.view === "map" ? { ...state, page: 1 } : state;
  const query = serializeSearchState(effectiveState);

  useEffect(() => {
    const controller = new AbortController();
    const pageSize = state.view === "map" ? MAP_VIEW_PAGE_SIZE : RESULTS_PER_PAGE;
    const path = `/search?${query}${query ? "&" : ""}pageSize=${pageSize}`;

    apiClient
      .get<SearchApiResponse>(path, { signal: controller.signal })
      .then((response) => {
        if (!response.success) {
          setData({ results: [], totalResults: 0, totalPages: 1, currentPage: 1, isEmpty: true, forQuery: query });
          return;
        }
        const { items, total, totalPages, page } = response.data;
        setData({
          results: items,
          totalResults: total,
          totalPages,
          currentPage: page,
          isEmpty: total === 0,
          forQuery: query,
        });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("[useSearchResults]", error);
        setData({ results: [], totalResults: 0, totalPages: 1, currentPage: 1, isEmpty: true, forQuery: query });
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `query` (serializeSearchState(state)) is the real dependency key; `state` itself is a new object every render.
  }, [query]);

  return { ...data, isLoading: data.forQuery !== query };
}
