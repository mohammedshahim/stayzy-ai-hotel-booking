"use client";

import { useEffect, useState } from "react";

import { apiClient } from "@/lib/api-client";
import type { BookingSummary } from "@/features/booking/types";

const POLL_INTERVAL_MS = 2000;
// ~20s total — long enough to cover Stripe webhook delivery under normal conditions
// without leaving the user staring at a spinner indefinitely.
const MAX_ATTEMPTS = 10;

type PollState = {
  booking: BookingSummary | null;
  timedOut: boolean;
  // The id this state belongs to — mirrors useBookingSummary's forId pattern, so state
  // is only ever set inside the async poll loop, never synchronously in the effect body.
  forId: string | null;
};

export type PollBookingStatusResult = {
  booking: BookingSummary | null;
  isPolling: boolean;
  timedOut: boolean;
};

// Polls until the booking leaves pending_payment (Feature 22's webhook is what actually
// flips it) or MAX_ATTEMPTS is reached, whichever comes first.
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
  // Resolved once we have a definitive answer: no booking found, a terminal status, or
  // we gave up retrying. Still pending_payment before that point means keep polling.
  const isResolved = isForCurrentId && (state.booking === null || state.booking.status !== "pending_payment" || state.timedOut);

  return {
    booking: isForCurrentId ? state.booking : null,
    isPolling: !isResolved,
    timedOut: isForCurrentId && state.timedOut,
  };
}
