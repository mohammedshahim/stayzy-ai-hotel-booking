"use client";

import { useEffect, useState } from "react";

import { apiClient } from "@/lib/api-client";

export type SearchSuggestion = {
  label: string;
  type: "recent" | "place";
};

const DEBOUNCE_MS = 250;

export function useSearchSuggestions(query: string): SearchSuggestion[] {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const trimmed = query.trim();

  useEffect(() => {
    if (!trimmed) return;

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      apiClient
        .get<SearchSuggestion[]>(`/search-suggestions?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        })
        .then((response) => setSuggestions(response.success ? response.data : []))
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          console.error("[useSearchSuggestions]", error);
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [trimmed]);

  return trimmed ? suggestions : [];
}
