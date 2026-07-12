# Memory — Feature 20 (Stripe Setup)

Last updated: 2026-07-12

## What was built

**Feature 20 — Stripe Setup (backend-only, no UI):**
- New `POST /payments/intent` (`payments.routes.ts`, mounted at `/payments`, behind `requireAuth` + `validateRequest(createPaymentIntentSchema)` from new `types/payment.schemas.ts`) → `payments.controller.ts` → new `services/payment.service.ts`'s `createPaymentIntentForBooking(userId, bookingId)`.
- New `backend/src/config/stripe.ts` — `getStripeClient()`, lazy singleton (same reasoning as `config/s3.ts`: avoids crashing server boot when the key isn't configured in some environment).
- `booking.queries.ts` gained `findBookingByIdForOwner` (plain ownership-scoped row) and `updateBookingStripePaymentIntentId`.
- Service logic: 404 (via `null` return, controller-mapped, same pattern as `GET /bookings/:id`) if the booking isn't the caller's; 400 if `status !== "pending_payment"`; if `bookings.stripePaymentIntentId` is already set, retrieves that PaymentIntent from Stripe and reuses its `client_secret` unless `canceled`/`succeeded`, otherwise creates a new one (`amount: totalPrice * 100`, `currency: "usd"`, `metadata.bookingId`) and persists the id back onto the booking.
- `stripe` was already installed in `backend/`; added `@stripe/stripe-js` + `@stripe/react-stripe-js` to `frontend/` (not wired into any UI yet — Feature 21's job).
- `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` (backend) and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (frontend) were already reserved as optional env vars from earlier scaffolding — developer supplied real test-mode values this session, confirmed working end-to-end against the real Stripe API.
- `progress-tracker.md` updated (Feature 20 marked complete, Feature 21 is next).
- Three separate commits pushed to `main`: `5c3998d` (backend), `b12be11` (frontend deps), `2e076aa` (docs).

## Decisions made

- PaymentIntent creation is idempotent per booking — check `bookings.stripePaymentIntentId` first, reuse unless terminal (`canceled`/`succeeded`), only mint a new one otherwise. Confirmed with the developer during `/architect`: avoids piling up abandoned PaymentIntents in the Stripe dashboard every time `/checkout/[bookingId]` (Feature 21) reloads.
- Status guard (400 on non-`pending_payment`) included now rather than deferred, even though nothing downstream depends on it until Feature 22's webhook exists. Confirmed during `/architect`.
- Currency hardcoded to `"usd"` — no `currency` field exists anywhere in the schema (hotels/room_types), so this wasn't actually a decision point, just a confirmed assumption.

## Problems solved

- No real bugs this session — first end-to-end pass worked as designed.
- Environment gotcha (not a code bug): `tsx watch` doesn't restart the backend dev server on `.env` file changes, only on source-file changes. After the developer pasted in real Stripe keys, the first live curl attempt correctly surfaced `STRIPE_SECRET_KEY is not configured` from the stale env snapshot — fixed by manually killing and restarting the dev server. Worth remembering for any future session where env vars change mid-session.

## Current state

Feature 20 fully built, verified, committed, and pushed to `origin/main` (3 commits: `5c3998d`, `b12be11`, `2e076aa`). Nothing uncommitted.

Verified end-to-end against the real Stripe test-mode API (not mocked) and the real seeded DB: created a real booking (Hotel Marais Charme, Classic Double Room, 3 nights, `totalPrice: 435`), first `/payments/intent` call created a new PaymentIntent, second call for the same booking returned the identical PaymentIntent id (idempotent reuse confirmed), `bookings.stripe_payment_intent_id` persisted correctly. All guard paths confirmed: no session → 401; another user's booking → 404; nonexistent booking id → 404; owner's own booking with status manually flipped to `confirmed` → 400. Fetched the created PaymentIntent directly from the real Stripe API and confirmed `amount: 43500` (cents, = $435.00), `currency: "usd"`, `metadata.bookingId` matching. `tsc`/`eslint`/production builds clean on both apps. All test users/bookings/sessions cleaned up from the DB afterward.

Real Stripe test-mode keys are now live in `backend/.env` (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) and `frontend/.env.local` (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`) — both gitignored, never committed. `STRIPE_WEBHOOK_SECRET` currently holds a `stripe listen`-issued value from local testing but nothing consumes it yet (Feature 22).

## Next session starts with

Feature 21 — Checkout Page: wire Stripe Elements into the existing `/checkout/[bookingId]` scaffold from Feature 19 (currently a disabled "Pay Now" placeholder in `CheckoutPageContent.tsx`), calling the new `POST /payments/intent` endpoint to get a `client_secret` and rendering a real Stripe payment form. Read `build-plan.md`'s Feature 21 section first.

Also worth remembering: for local webhook testing later (Feature 22), the correct flow is `stripe listen --forward-to localhost:4000/webhooks/stripe` (CLI-based, no Stripe Dashboard endpoint URL needed for local dev) — a Dashboard-configured endpoint only becomes relevant at production deployment (Feature 32).

## Open questions

- The Feature 16 rating-consistency question (hotel-details header vs. live-computed review numbers) — still carried over, unresolved across five sessions running, not raised again this session.
