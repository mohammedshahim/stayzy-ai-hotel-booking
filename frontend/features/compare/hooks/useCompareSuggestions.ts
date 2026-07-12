"use client";

import { useEffect, useState } from "react";

import { apiClient } from "@/lib/api-client";
import type { HotelSearchSuggestion } from "@/features/compare/types";

const DEBOUNCE_MS = 250;

// Same debounced + AbortController-cancelled pattern as useSearchSuggestions.
export function useCompareSuggestions(query: string, excludeIds: string[]): HotelSearchSuggestion[] {
  const [suggestions, setSuggestions] = useState<HotelSearchSuggestion[]>([]);
  const trimmed = query.trim();
  const excludeKey = excludeIds.join(",");

  useEffect(() => {
    if (!trimmed) return;

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      const excludeParam = excludeKey ? `&excludeIds=${excludeKey}` : "";
      apiClient
        .get<HotelSearchSuggestion[]>(`/hotels/search-suggestions?q=${encodeURIComponent(trimmed)}${excludeParam}`, {
          signal: controller.signal,
        })
        .then((response) => setSuggestions(response.success ? response.data : []))
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          console.error("[useCompareSuggestions]", error);
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [trimmed, excludeKey]);

  return trimmed ? suggestions : [];
}
