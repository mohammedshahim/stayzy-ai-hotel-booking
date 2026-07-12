import { loadStripe, type Stripe } from "@stripe/stripe-js";

// Lazy singleton, same reasoning as backend's config/stripe.ts — loadStripe() kicks off
// a network request, so it should only ever run once per page load, not per render.
let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
}
