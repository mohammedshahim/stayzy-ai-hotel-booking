"use client";

import { useEffect, useState } from "react";

import { apiClient } from "@/lib/api-client";
import type { HotelAiSummary } from "@/features/hotel-details/types";

type FetchedData = {
  summary: string | null;
  // forId is null until the first fetch resolves, so isLoading reads true on mount.
  forId: string | null;
};

export type HotelSummaryResult = {
  summary: string | null;
  isLoading: boolean;
};

export function useHotelSummary(hotelId: string): HotelSummaryResult {
  const [data, setData] = useState<FetchedData>({ summary: null, forId: null });

  useEffect(() => {
    apiClient
      .get<HotelAiSummary>(`/ai/hotels/${hotelId}/summary`)
      .then((response) => setData({ summary: response.success ? response.data.summary : null, forId: hotelId }))
      .catch((error: unknown) => {
        console.error("[useHotelSummary]", error);
        setData({ summary: null, forId: hotelId });
      });
  }, [hotelId]);

  return { summary: data.summary, isLoading: data.forId !== hotelId };
}
