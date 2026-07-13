import { db } from "../config/db";
import { getStripeClient } from "../config/stripe";
import { lockBookingForOwner, updateBookingStripePaymentIntentId } from "../queries/booking.queries";

// Tagged 400 so errorHandler.ts's `err.status ?? 500` doesn't log caller-fault failures as server errors.
function badRequest(message: string): Error {
  return Object.assign(new Error(message), { status: 400 });
}

// A PaymentIntent in either of these states is done — can't be reused for a new attempt.
const TERMINAL_INTENT_STATUSES = new Set(["canceled", "succeeded"]);

export async function createPaymentIntentForBooking(
  userId: string,
  bookingId: string,
): Promise<{ clientSecret: string } | null> {
  const stripe = getStripeClient();

  // Locked for the transaction's lifetime so two near-simultaneous calls (e.g. a double-fired mount effect) serialize onto the same PaymentIntent instead of each minting its own — the second call sees the first's write once it acquires the lock.
  return db.transaction(async (tx) => {
    const booking = await lockBookingForOwner(tx, bookingId, userId);
    if (!booking) return null;
    if (booking.status !== "pending_payment") {
      throw badRequest("This booking can no longer be paid for");
    }

    if (booking.stripePaymentIntentId) {
      const existing = await stripe.paymentIntents.retrieve(booking.stripePaymentIntentId);
      if (!TERMINAL_INTENT_STATUSES.has(existing.status) && existing.client_secret) {
        return { clientSecret: existing.client_secret };
      }
    }

    const intent = await stripe.paymentIntents.create({
      amount: Math.round(booking.totalPrice * 100),
      currency: "usd",
      metadata: { bookingId: booking.id },
    });
    if (!intent.client_secret) {
      throw new Error("Stripe did not return a client secret");
    }

    await updateBookingStripePaymentIntentId(booking.id, intent.id, tx);
    return { clientSecret: intent.client_secret };
  });
}
