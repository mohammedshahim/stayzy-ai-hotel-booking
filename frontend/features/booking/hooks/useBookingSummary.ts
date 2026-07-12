"use client";

import { useEffect, useState } from "react";

import { apiClient } from "@/lib/api-client";
import type { BookingSummary } from "@/features/booking/types";

type FetchedData = {
  booking: BookingSummary | null;
  // The id this data was fetched for — `null` until the first fetch resolves, so
  // isLoading below reads true on mount instead of matching an accidental empty string.
  forId: string | null;
};

export type BookingSummaryResult = {
  booking: BookingSummary | null;
  isLoading: boolean;
};

export function useBookingSummary(bookingId: string): BookingSummaryResult {
  const [data, setData] = useState<FetchedData>({ booking: null, forId: null });

  useEffect(() => {
    apiClient
      .get<BookingSummary>(`/bookings/${bookingId}`)
      .then((response) => setData({ booking: response.success ? response.data : null, forId: bookingId }))
      .catch((error: unknown) => {
        console.error("[useBookingSummary]", error);
        setData({ booking: null, forId: bookingId });
      });
  }, [bookingId]);

  return { booking: data.booking, isLoading: data.forId !== bookingId };
}
