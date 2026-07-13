"use client";

import { useState } from "react";

import { apiClient } from "@/lib/api-client";

export type DeleteReviewResult = {
  deleteReview: (bookingId: string) => Promise<boolean>;
  isDeleting: boolean;
  error: string | null;
};

export function useDeleteReview(): DeleteReviewResult {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteReview(bookingId: string): Promise<boolean> {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await apiClient.delete<null>(`/bookings/${bookingId}/review`);
      if (!response.success) {
        setError(response.error);
        return false;
      }
      return true;
    } catch (err) {
      console.error("[useDeleteReview]", err);
      setError("Something went wrong. Please try again.");
      return false;
    } finally {
      setIsDeleting(false);
    }
  }

  return { deleteReview, isDeleting, error };
}
