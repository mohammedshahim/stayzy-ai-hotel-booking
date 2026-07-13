"use client";

import { useState } from "react";

import { apiClient } from "@/lib/api-client";
import type { Booking } from "@/features/booking/types";

export type CancelBookingResult = {
  cancelBooking: (bookingId: string) => Promise<Booking | null>;
  isCancelling: boolean;
  error: string | null;
};

export function useCancelBooking(): CancelBookingResult {
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancelBooking(bookingId: string): Promise<Booking | null> {
    setIsCancelling(true);
    setError(null);

    try {
      const response = await apiClient.post<Booking>(`/bookings/${bookingId}/cancel`);
      if (!response.success) {
        setError(response.error);
        return null;
      }
      return response.data;
    } catch (err) {
      console.error("[useCancelBooking]", err);
      setError("Something went wrong. Please try again.");
      return null;
    } finally {
      setIsCancelling(false);
    }
  }

  return { cancelBooking, isCancelling, error };
}
