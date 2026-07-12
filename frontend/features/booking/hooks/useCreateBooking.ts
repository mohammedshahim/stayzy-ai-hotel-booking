"use client";

import { useState } from "react";

import { apiClient } from "@/lib/api-client";
import type { Booking, CreateBookingParams } from "@/features/booking/types";

export type CreateBookingResult = {
  createBooking: (params: CreateBookingParams) => Promise<Booking | null>;
  isSubmitting: boolean;
  error: string | null;
};

export function useCreateBooking(): CreateBookingResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createBooking(params: CreateBookingParams): Promise<Booking | null> {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await apiClient.post<Booking>("/bookings", params);
      if (!response.success) {
        setError(response.error);
        return null;
      }
      return response.data;
    } catch (err) {
      console.error("[useCreateBooking]", err);
      setError("Something went wrong. Please try again.");
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }

  return { createBooking, isSubmitting, error };
}
