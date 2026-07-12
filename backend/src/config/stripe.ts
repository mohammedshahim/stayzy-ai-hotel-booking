import Stripe from "stripe";
import { env } from "./env";

let client: Stripe | null = null;

// Constructed lazily (not at import time), same reasoning as config/s3.ts — the Stripe SDK
// throws synchronously if the key is missing, which would crash the whole server on startup
// in any environment where Stripe isn't configured yet, even though only payment creation needs it.
export function getStripeClient(): Stripe {
  if (!client) {
    if (!env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    client = new Stripe(env.STRIPE_SECRET_KEY);
  }
  return client;
}
