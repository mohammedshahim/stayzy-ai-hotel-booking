import type Stripe from "stripe";
import { getStripeClient } from "../config/stripe";
import { env } from "../config/env";
import { confirmBookingIfPending, failBookingIfPending, findBookingByStripePaymentIntentId } from "../queries/booking.queries";

function badRequest(message: string): Error {
  return Object.assign(new Error(message), { status: 400 });
}

export function constructStripeEvent(rawBody: Buffer, signature: string): Stripe.Event {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }
  try {
    return getStripeClient().webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    throw badRequest("Invalid Stripe signature");
  }
}

async function transitionBookingForIntent(paymentIntentId: string, transition: typeof confirmBookingIfPending): Promise<void> {
  const booking = await findBookingByStripePaymentIntentId(paymentIntentId);
  // No matching booking, or it already moved past pending_payment (e.g. the expiry sweep beat this event) — safe no-op either way.
  if (!booking) return;
  await transition(booking.id);
}

export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "payment_intent.succeeded":
      await transitionBookingForIntent(event.data.object.id, confirmBookingIfPending);
      break;
    case "payment_intent.payment_failed":
      await transitionBookingForIntent(event.data.object.id, failBookingIfPending);
      break;
    default:
      break;
  }
}
