import Stripe from "stripe";
import { env } from "./env";

let client: Stripe | null = null;

// Constructed lazily, same reasoning as config/s3.ts — the Stripe SDK throws synchronously if the key is missing.
export function getStripeClient(): Stripe {
  if (!client) {
    if (!env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    client = new Stripe(env.STRIPE_SECRET_KEY);
  }
  return client;
}
