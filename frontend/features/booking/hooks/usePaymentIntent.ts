"use client";

import { useEffect, useState } from "react";

import { apiClient } from "@/lib/api-client";

type PaymentIntentResponse = {
  clientSecret: string;
};

type FetchedData = {
  clientSecret: string | null;
  error: string | null;
  // The id this data was fetched for — mirrors useBookingSummary's forId pattern so
  // isLoading reads true on mount instead of matching an accidental empty string.
  forId: string | null;
};

export type PaymentIntentResult = {
  clientSecret: string | null;
  isLoading: boolean;
  error: string | null;
};

export function usePaymentIntent(bookingId: string): PaymentIntentResult {
  const [data, setData] = useState<FetchedData>({ clientSecret: null, error: null, forId: null });

  useEffect(() => {
    apiClient
      .post<PaymentIntentResponse>("/payments/intent", { bookingId })
      .then((response) => {
        if (response.success) {
          setData({ clientSecret: response.data.clientSecret, error: null, forId: bookingId });
        } else {
          setData({ clientSecret: null, error: response.error, forId: bookingId });
        }
      })
      .catch((error: unknown) => {
        console.error("[usePaymentIntent]", error);
        setData({ clientSecret: null, error: "Something went wrong. Please try again.", forId: bookingId });
      });
  }, [bookingId]);

  return { clientSecret: data.clientSecret, isLoading: data.forId !== bookingId, error: data.error };
}
