# Memory — Feature 19 (Booking Creation) + follow-up fixes

Last updated: 2026-07-12

## What was built

**Feature 19 — Booking Creation:**
- Backend: `POST /bookings` (`bookings.routes.ts`, `requireAuth` + `validateRequest(createBookingSchema)`) creates a `pending_payment` row via `booking.service.ts`'s `createBookingForUser` — wraps the final availability re-check and insert in one `db.transaction`, row-locking the target `room_types` row (`.for("update")`, `booking.queries.ts`'s `lockRoomTypeForBooking`) so two concurrent Reserve clicks on the same room serialize instead of racing. `GET /bookings/:id` (owner-scoped, `findBookingSummaryByIdForOwner`) backs the checkout page. New `backend/src/types/booking.schemas.ts`, `queries/booking.queries.ts`, `services/booking.service.ts`, `controllers/bookings.controller.ts`, `routes/bookings.routes.ts`.
- Backend (the bigger piece): room availability is now booking-aware everywhere, not just at insert time. New `search.queries.ts`'s `findOverlappingBookings` (overlap-date SQL, optional `executor` param so it can run inside a transaction) + `availability.service.ts`'s `HELD_BOOKING_STATUSES` (`pending_payment`/`confirmed`/`completed`) and `buildBookedCountsByRoomType`, subtracted from effective inventory in both `findQualifyingRoomTypes` (search, Feature 09) and `resolveRoomTypeAvailability` (room selection, Feature 13) — one implementation, three call sites (search, room selection, booking-creation re-check).
- Frontend: new `features/booking/` — `hooks/{useCreateBooking,useBookingSummary,useReserveRoom}.ts`, `components/{CheckoutPageContent,BookingSummaryCard,CheckoutSkeleton}.tsx`. `RoomTypeCard.tsx`'s Reserve button is now live (was a permanently-disabled "Coming soon"/"Sold out" placeholder since Feature 13). New `/checkout/[bookingId]` route — the app's first real page-level auth guard (`getServerSession()` + `redirect()`), rendering a real booking summary + a disabled "Pay Now" placeholder (Feature 21's job to wire up).

**Follow-up fixes (same session, found via `/review`):**
- Navbar login-state bug: `LoginForm.tsx` and `SignupForm.tsx` were missing `router.refresh()` after `router.push()` — `Navbar.tsx` is a Server Component in the root layout, so a client-side `router.push()` alone doesn't invalidate its cached session read; the Navbar kept showing "Log in" after a successful login/signup until a manual reload. `AccountMenu.tsx`'s logout already had the correct pattern (`push` + `refresh`); login/signup just never got it. Fixed both files, verified with a real Playwright pass (immediate Navbar update, no reload).
- Default-date gap: none of the date pickers visibly defaulted to today→tomorrow even though the backend always silently did (search.controller.ts, hotels.controller.ts). `HeroSearchWidget.tsx` and `RoomSelectionSection.tsx` both now initialize their `DateRangePicker` state to today/tomorrow instead of `undefined` ("Add dates"). New shared helpers `backend/src/utils/date.ts` and `frontend/lib/date.ts` (`todayIso`/`tomorrowIso`, plus `defaultDateRange()` for picker state) replace three previously-duplicated copies of the same logic.
- `ui-registry.md` updated via `/imprint` to correct drift introduced by the two fixes above (Hero Search Widget, Room Selection entries) and document the new `CheckoutSkeleton`.

## Decisions made

- Booking-aware availability math was brought in scope for Feature 19 rather than deferred — without it, search/room-selection would keep showing rooms as available after they're actually reserved. Confirmed with the developer during `/architect` as the single biggest-blast-radius call of the session.
- Insert-time re-check uses a real DB transaction + row lock (`.for("update")`), not a best-effort check — closes the double-booking race window. Confirmed during `/architect`.
- Logged-out Reserve auto-completes after login (via `returnTo=/hotels/[id]?...&autoReserve=1`, reusing `LoginForm`'s existing `returnTo` handling) rather than requiring a second manual click — but the auto-fire effect only proceeds when a session is *positively confirmed* verified client-side; otherwise it silently no-ops rather than risking a `/login` redirect loop.
- `/checkout/[bookingId]` got a real minimal scaffold in Feature 19 (not deferred to Feature 21) — matches `build-plan.md`'s "every feature must be visible and testable" principle; Feature 21 only swaps the payment placeholder.
- Frontend mutations go through a client hook + `apiClient` (matching Favorites/Compare's actual established pattern), not `code-standards.md`'s documented-but-never-actually-used Server Actions convention. The doc itself was left uncorrected — worth fixing someday but out of scope.

## Problems solved

- Navbar stale-session bug — see "Follow-up fixes" above. Root cause: missing `router.refresh()`, not a session/cookie issue.
- Date pickers not reflecting the backend's own default — see "Follow-up fixes" above.
- No new problems from Feature 19's core build itself — the transaction/row-lock approach and the shared availability helper worked on the first real end-to-end pass (curl + Playwright), unlike most prior features which hit at least one real bug during verification.

## Current state

Feature 19 + both follow-up fixes are fully built, verified, and documented — **all uncommitted** (asked about committing multiple times this session; developer has not yet said yes). Dev servers were running during this session (backend :4000, frontend :3000) — may or may not still be up next session.

Verified end-to-end: `tsc`/`eslint`/production builds clean on both apps throughout. Direct `curl` against the real seeded DB covered every booking-creation edge case (403 unverified, 401 unauthenticated, 400 sold-out/capacity-mismatch/hotel-mismatch/inverted-dates, 201 with correct server-computed price, inventory correctly dropping in both `/search` and room-selection immediately after a booking). Real Playwright passes confirmed: the full logged-out→login→signup→verify→auto-reserve→checkout round trip; the separate unverified-user→`/verify-email` redirect (no `/login` loop); the Navbar login-state fix; and the date-default fix across the homepage widget, `/search` URL, and hotel-details room selection. Zero console errors in every pass except one confirmed-benign script artifact (`useSearchResults` "Failed to fetch" from a test script navigating away mid-fetch, same class of false-positive documented in earlier sessions). All test users/bookings/sessions cleaned up from the DB after each pass.

**Two gaps discussed with the developer but explicitly NOT implemented (they asked for explanation only):**
1. No way to resume an abandoned checkout — no "My Bookings" page exists yet (`frontend/app/bookings/` is empty, that's Feature 23), no reminder/banner anywhere. The only path back to `/checkout/[bookingId]` is if the user still has that exact URL. Also noted: nothing currently stops a second `pending_payment` booking being created if the user clicks Reserve again instead of finding their way back.
2. No auto-unlock for a stale `pending_payment` hold — a reserved room stays locked indefinitely today. This is intentionally deferred to Feature 22 (Stripe Webhook), whose spec explicitly includes a scheduled cleanup sweep. No cron/scheduled job exists anywhere in the backend yet.

## Next session starts with

Ask the developer whether to: (a) commit everything accumulated this session (Feature 19 + Navbar fix + date-default fix, all currently uncommitted), then (b) move to Feature 20 — Stripe Setup (read `build-plan.md`'s Phase 5 section for it — Stripe account/keys, `stripe`/`@stripe/stripe-js`/`@stripe/react-stripe-js` install, `POST /payments/intent`).

## Open questions

- Whether/how to commit the accumulated uncommitted changes — asked multiple times this session, never confirmed either way.
- The Feature 16 rating-consistency question (hotel-details header vs. live-computed review numbers) — still carried over, now unresolved across four sessions running, not raised again this session.
