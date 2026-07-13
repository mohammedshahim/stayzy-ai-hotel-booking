"use client";

import { useEffect, useState } from "react";

import { apiClient } from "@/lib/api-client";
import type { CompareHotel } from "@/features/compare/types";

export type CompareHotelsResult = {
  hotels: CompareHotel[];
  isLoading: boolean;
};

// Shared by CompareTray and the /compare table; both fetch fresh since only bare ids persist client-side.
export function useCompareHotels(ids: string[]): CompareHotelsResult {
  const [hotels, setHotels] = useState<CompareHotel[]>([]);
  // isLoading is derived by comparing idsKey to the last-resolved key, keeping setState calls inside promise callbacks.
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const idsKey = ids.join(",");

  useEffect(() => {
    if (!idsKey) return;

    const controller = new AbortController();
    apiClient
      .get<CompareHotel[]>(`/hotels/compare?ids=${idsKey}`, { signal: controller.signal })
      .then((response) => {
        setHotels(response.success ? response.data : []);
        setLoadedKey(idsKey);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("[useCompareHotels]", error);
        setLoadedKey(idsKey);
      });

    return () => controller.abort();
  }, [idsKey]);

  return { hotels: idsKey ? hotels : [], isLoading: idsKey !== "" && idsKey !== loadedKey };
}
