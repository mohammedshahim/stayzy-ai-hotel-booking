"use client";

import { useEffect, useState } from "react";

import { apiClient } from "@/lib/api-client";
import type { HotelDetails } from "@/features/hotel-details/types";

type FetchedData = {
  hotel: HotelDetails | null;
  // forId is null until the first fetch resolves, so isLoading reads true on mount.
  forId: string | null;
};

export type HotelDetailsResult = {
  hotel: HotelDetails | null;
  isLoading: boolean;
};

export function useHotelDetails(id: string): HotelDetailsResult {
  const [data, setData] = useState<FetchedData>({ hotel: null, forId: null });

  useEffect(() => {
    apiClient
      .get<HotelDetails>(`/hotels/${id}`)
      .then((response) => setData({ hotel: response.success ? response.data : null, forId: id }))
      .catch((error: unknown) => {
        console.error("[useHotelDetails]", error);
        setData({ hotel: null, forId: id });
      });
  }, [id]);

  return { hotel: data.hotel, isLoading: data.forId !== id };
}
