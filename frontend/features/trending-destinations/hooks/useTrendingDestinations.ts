"use client";

import { useEffect, useState } from "react";

import { apiClient } from "@/lib/api-client";

export type TrendingDestination = {
  city: string;
  country: string;
  hotelCount: number;
  mainImageUrl: string | null;
};

export function useTrendingDestinations(): TrendingDestination[] {
  const [trendingDestinations, setTrendingDestinations] = useState<TrendingDestination[]>([]);

  useEffect(() => {
    apiClient
      .get<TrendingDestination[]>("/trending-destinations")
      .then((response) => setTrendingDestinations(response.success ? response.data : []))
      .catch((error: unknown) => {
        console.error("[useTrendingDestinations]", error);
      });
  }, []);

  return trendingDestinations;
}
