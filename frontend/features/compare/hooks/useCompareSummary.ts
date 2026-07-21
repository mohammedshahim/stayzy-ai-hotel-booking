"use client";

import { useCallback, useState } from "react";

import { apiClient } from "@/lib/api-client";
import type { CompareAiSummary } from "@/features/compare/types";

type State = {
  summary: string | null;
  isLoading: boolean;
  hasFailed: boolean;
  forKey: string;
};

const IDLE: State = { summary: null, isLoading: false, hasFailed: false, forKey: "" };

export type CompareSummaryResult = Omit<State, "forKey"> & {
  generate: () => void;
};

export function useCompareSummary(ids: string[]): CompareSummaryResult {
  const [state, setState] = useState<State>(IDLE);
  const idsKey = ids.join(",");

  const generate = useCallback(() => {
    setState({ summary: null, isLoading: true, hasFailed: false, forKey: idsKey });

    apiClient
      .get<CompareAiSummary>(`/ai/hotels/compare-summary?ids=${idsKey}`)
      .then((response) => {
        const summary = response.success ? response.data.summary : null;
        setState({ summary, isLoading: false, hasFailed: summary === null, forKey: idsKey });
      })
      .catch((error: unknown) => {
        console.error("[useCompareSummary]", error);
        setState({ summary: null, isLoading: false, hasFailed: true, forKey: idsKey });
      });
  }, [idsKey]);

  // Derived rather than reset in an effect, the same way useCompareHotels handles isLoading.
  const { summary, isLoading, hasFailed } = state.forKey === idsKey ? state : IDLE;

  return { summary, isLoading, hasFailed, generate };
}
