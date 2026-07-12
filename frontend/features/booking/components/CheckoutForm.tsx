"use client";

import { useState, type FormEvent } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { AlertCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getStripe } from "@/lib/stripe-client";
import { usePaymentIntent } from "@/features/booking/hooks/usePaymentIntent";

type Props = {
  bookingId: string;
};

export function CheckoutForm({ bookingId }: Props) {
  const { clientSecret, isLoading, error } = usePaymentIntent(bookingId);

  if (isLoading) {
    return <div className="h-48 animate-pulse bg-subtle" />;
  }

  if (error || !clientSecret) {
    return (
      <div className="flex flex-col items-center gap-3 p-10 text-center">
        <AlertCircleIcon className="h-10 w-10 text-error" strokeWidth={1.5} />
        <p className="text-sm text-text-muted">{error ?? "Unable to start payment. Please try again."}</p>
      </div>
    );
  }

  return (
    <Elements stripe={getStripe()} options={{ clientSecret }}>
      <PaymentForm bookingId={bookingId} />
    </Elements>
  );
}

function PaymentForm({ bookingId }: { bookingId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!stripe || !elements) return;

    setIsSubmitting(true);
    setError(null);

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/booking-confirmation/${bookingId}`,
      },
    });

    // Only reached for immediate failures (e.g. a declined card) — success and
    // any redirect-required outcome navigate away before this line runs.
    if (confirmError) {
      setError(confirmError.message ?? "Payment failed. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
      <PaymentElement />
      {error && <p className="text-xs text-error">{error}</p>}
      <Button
        type="submit"
        disabled={!stripe || isSubmitting}
        className="h-10 rounded-xl bg-accent-primary px-6 font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Processing…" : "Pay Now"}
      </Button>
    </form>
  );
}
