"use client";

import { useEffect, useState } from "react";

import { apiClient } from "@/lib/api-client";
import type { OwnReview } from "@/features/reviews/types";

type FetchedData = {
  review: OwnReview | null;
  // forKey folds in `enabled` (not just bookingId) so isLoading correctly re-arms when enabled flips false→true —
  // otherwise the disabled branch's resolved forId would already match bookingId and mask the still-in-flight real fetch.
  forKey: string | null;
};

export type OwnReviewResult = {
  review: OwnReview | null;
  isLoading: boolean;
};

// enabled lets callers skip the request entirely when they already know (e.g. from BookingSummary.review) that no review
// exists yet — otherwise every first-time "Leave a review" visit would fire a request that's guaranteed to 404.
export function useOwnReview(bookingId: string, enabled: boolean): OwnReviewResult {
  const [data, setData] = useState<FetchedData>({ review: null, forKey: null });
  const key = `${bookingId}:${enabled}`;

  useEffect(() => {
    if (!enabled) return;

    apiClient
      .get<OwnReview>(`/bookings/${bookingId}/review`)
      .then((response) => setData({ review: response.success ? response.data : null, forKey: key }))
      .catch((error: unknown) => {
        console.error("[useOwnReview]", error);
        setData({ review: null, forKey: key });
      });
  }, [bookingId, enabled, key]);

  if (!enabled) {
    return { review: null, isLoading: false };
  }
  return { review: data.review, isLoading: data.forKey !== key };
}
