"use client";

import { useCallback, useState } from "react";

import { apiClient } from "@/lib/api-client";
import type { SearchFilterExtraction } from "@/features/search/types";

type State = {
  extraction: SearchFilterExtraction | null;
  isLoading: boolean;
  hasFailed: boolean;
};

const IDLE: State = { extraction: null, isLoading: false, hasFailed: false };

export type SmartSearchResult = State & {
  extract: (prompt: string) => void;
  dismiss: () => void;
};

export function useSmartSearch(
  onExtracted: (extraction: SearchFilterExtraction) => void,
): SmartSearchResult {
  const [state, setState] = useState<State>(IDLE);

  const extract = useCallback(
    (prompt: string) => {
      setState({ extraction: null, isLoading: true, hasFailed: false });

      apiClient
        .post<SearchFilterExtraction | null>("/ai/search/extract", { prompt })
        .then((response) => {
          const extraction = response.success ? response.data : null;
          if (!extraction) {
            setState({ extraction: null, isLoading: false, hasFailed: true });
            return;
          }
          setState({ extraction, isLoading: false, hasFailed: false });
          onExtracted(extraction);
        })
        .catch((error: unknown) => {
          console.error("[useSmartSearch]", error);
          setState({ extraction: null, isLoading: false, hasFailed: true });
        });
    },
    [onExtracted],
  );

  const dismiss = useCallback(() => setState(IDLE), []);

  return { ...state, extract, dismiss };
}
