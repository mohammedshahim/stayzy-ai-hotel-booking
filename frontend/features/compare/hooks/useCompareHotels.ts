"use client";

import { useEffect, useState } from "react";

import { apiClient } from "@/lib/api-client";
import type { CompareHotel } from "@/features/compare/types";

export type CompareHotelsResult = {
  hotels: CompareHotel[];
  isLoading: boolean;
};

// Shared by CompareTray (renders a thumbnail/name subset) and the /compare table
// (renders everything) — both always fetch fresh rather than trusting any cached
// display data, since only bare ids are persisted client-side (see CompareProvider).
export function useCompareHotels(ids: string[]): CompareHotelsResult {
  const [hotels, setHotels] = useState<CompareHotel[]>([]);
  // isLoading is derived from comparing idsKey against the key the last fetch resolved
  // for, rather than an imperative setIsLoading(true) at the top of the effect — keeps
  // every setState call inside a promise callback, not the effect body itself.
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
