"use client";

import { useEffect, useState } from "react";

import { apiClient } from "@/lib/api-client";
import type { BookingSummary } from "@/features/booking/types";

const POLL_INTERVAL_MS = 2000;
// ~20s total — long enough to cover Stripe webhook delivery without an indefinite spinner.
const MAX_ATTEMPTS = 10;

type PollState = {
  booking: BookingSummary | null;
  timedOut: boolean;
  // Mirrors useBookingSummary's forId pattern; only ever set inside the async poll loop.
  forId: string | null;
};

export type PollBookingStatusResult = {
  booking: BookingSummary | null;
  isPolling: boolean;
  timedOut: boolean;
};

// Polls until the booking leaves pending_payment (flipped by Feature 22's webhook) or times out.
export function usePollBookingStatus(bookingId: string): PollBookingStatusResult {
  const [state, setState] = useState<PollState>({ booking: null, timedOut: false, forId: null });

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      for (let attempt = 1; attempt <= MAX_ATTEMPTS && !cancelled; attempt++) {
        try {
          const response = await apiClient.get<BookingSummary>(`/bookings/${bookingId}`);
          if (cancelled) return;

          if (response.success) {
            setState({ booking: response.data, timedOut: false, forId: bookingId });
            if (response.data.status !== "pending_payment") return;
          } else {
            // A definitive "not found" (e.g. 404) — no point retrying for the full window.
            setState({ booking: null, timedOut: false, forId: bookingId });
            return;
          }
        } catch (error) {
          console.error("[usePollBookingStatus]", error);
        }

        if (attempt < MAX_ATTEMPTS && !cancelled) {
          await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        }
      }

      if (!cancelled) {
        setState((prev) => ({ ...prev, timedOut: true, forId: bookingId }));
      }
    }

    poll();

    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  const isForCurrentId = state.forId === bookingId;
  // Resolved once we have a definitive answer: not found, a terminal status, or timed out.
  const isResolved = isForCurrentId && (state.booking === null || state.booking.status !== "pending_payment" || state.timedOut);

  return {
    booking: isForCurrentId ? state.booking : null,
    isPolling: !isResolved,
    timedOut: isForCurrentId && state.timedOut,
  };
}
