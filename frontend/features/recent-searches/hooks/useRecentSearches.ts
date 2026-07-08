"use client";

import { useEffect, useState } from "react";

import { apiClient } from "@/lib/api-client";

export type RecentSearchSummary = {
  destinationQuery: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  kids: number;
  rooms: number;
  searchedAt: string;
};

export function useRecentSearches(): RecentSearchSummary[] {
  const [recentSearches, setRecentSearches] = useState<RecentSearchSummary[]>([]);

  useEffect(() => {
    apiClient
      .get<RecentSearchSummary[]>("/recent-searches")
      .then((response) => setRecentSearches(response.success ? response.data : []))
      .catch((error: unknown) => {
        console.error("[useRecentSearches]", error);
      });
  }, []);

  return recentSearches;
}
