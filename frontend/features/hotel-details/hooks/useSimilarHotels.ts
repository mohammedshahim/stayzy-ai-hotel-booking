"use client";

import { useEffect, useState } from "react";

import { apiClient } from "@/lib/api-client";
import type { SimilarHotel } from "@/features/hotel-details/types";

type FetchedData = {
  hotels: SimilarHotel[];
  // forId is null until the first fetch resolves, so isLoading reads true on mount.
  forId: string | null;
};

export type SimilarHotelsResult = {
  hotels: SimilarHotel[];
  isLoading: boolean;
};

export function useSimilarHotels(hotelId: string): SimilarHotelsResult {
  const [data, setData] = useState<FetchedData>({ hotels: [], forId: null });

  useEffect(() => {
    apiClient
      .get<SimilarHotel[]>(`/hotels/${hotelId}/similar`)
      .then((response) => setData({ hotels: response.success ? response.data : [], forId: hotelId }))
      .catch((error: unknown) => {
        console.error("[useSimilarHotels]", error);
        setData({ hotels: [], forId: hotelId });
      });
  }, [hotelId]);

  return { hotels: data.hotels, isLoading: data.forId !== hotelId };
}
