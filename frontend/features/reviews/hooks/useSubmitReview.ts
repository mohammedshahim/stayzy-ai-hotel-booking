"use client";

import { useState } from "react";

import { apiClient } from "@/lib/api-client";
import type { OwnReview, ReviewInput } from "@/features/reviews/types";

export type SubmitReviewResult = {
  submitReview: (bookingId: string, mode: "create" | "edit", input: ReviewInput) => Promise<OwnReview | null>;
  isSubmitting: boolean;
  error: string | null;
};

export function useSubmitReview(): SubmitReviewResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitReview(bookingId: string, mode: "create" | "edit", input: ReviewInput): Promise<OwnReview | null> {
    setIsSubmitting(true);
    setError(null);

    try {
      const response =
        mode === "create"
          ? await apiClient.post<OwnReview>(`/bookings/${bookingId}/review`, input)
          : await apiClient.patch<OwnReview>(`/bookings/${bookingId}/review`, input);
      if (!response.success) {
        setError(response.error);
        return null;
      }
      return response.data;
    } catch (err) {
      console.error("[useSubmitReview]", err);
      setError("Something went wrong. Please try again.");
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }

  return { submitReview, isSubmitting, error };
}
