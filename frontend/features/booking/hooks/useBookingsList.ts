"use client";

import { useEffect, useState } from "react";

import { apiClient } from "@/lib/api-client";
import type { BookingSummary } from "@/features/booking/types";

export type BookingsListResult = {
  bookings: BookingSummary[];
  isLoading: boolean;
};

export function useBookingsList(): BookingsListResult {
  const [bookings, setBookings] = useState<BookingSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<BookingSummary[]>("/bookings")
      .then((response) => setBookings(response.success ? response.data : []))
      .catch((error: unknown) => {
        console.error("[useBookingsList]", error);
        setBookings([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return { bookings, isLoading };
}
