# Memory — Feature 23 (My Bookings)

Last updated: 2026-07-13

## What was built

**Feature 23 — My Bookings (list + detail + self-service cancellation):**
- Backend: `GET /bookings` (new `findBookingsForOwner` in `booking.queries.ts`, same joined shape as the existing single-booking summary query, ordered by `createdAt desc`) and `POST /bookings/:id/cancel` (new `cancelConfirmedBookingForOwner`, a conditioned `UPDATE ... WHERE status = 'confirmed'`, same safe-by-construction pattern as Feature 22's `transitionBookingIfPending`).
- `booking.queries.ts`'s `BookingSummaryRow` gained raw `roomTypeFreeCancellation`/`hotelFreeCancellation` columns; `booking.service.ts` collapses them into one `isCancellable: boolean` on its public `BookingSummary` type (`status === 'confirmed' && (roomTypeFreeCancellation ?? hotelFreeCancellation)`) — the frontend never re-derives this eligibility logic itself.
- `cancelBookingForUser` (service): returns `null` if the booking doesn't exist/isn't owned (controller 404s, matching existing precedent), throws a tagged 400 (`badRequest`) for "not confirmed" and "non-refundable" — reusing `findBookingSummaryByIdForOwner` for the eligibility check rather than a separate query.
- Frontend: `frontend/app/bookings/page.tsx` and `frontend/app/bookings/[id]/page.tsx` — both server-guarded exactly like `/checkout/[bookingId]` (`getServerSession` + redirect to `/login?returnTo=...`), since bookings have no guest concept (unlike Favorites).
- New `features/booking/components/`: `BookingStatusBadge` (first real implementation of the pre-locked 5-variant badge family — feature-scoped, not `components/common/`), `BookingListCard` (list-row card, `RoomTypeCard`-style anatomy, whole-card `Link`), `BookingsPageContent` (list page, `FavoritesPageContent`'s shell narrowed to `max-w-4xl`, stacked list not a grid), `BookingDetailPageContent` (detail page, `max-w-3xl`), `CancelBookingSection` (three states: nothing / non-refundable message / cancel button → inline confirm, no dialog library).
- `BookingSummaryCard.tsx` updated: header is now `flex items-center justify-between` with the badge added — this component is reused verbatim on Checkout and Booking Confirmation, so both those pages now also show a live status badge as a side effect (correct, not a regression).
- `frontend/features/booking/types.ts`: `BookingSummary` gained `isCancellable: boolean`.
- `context/ui-registry.md` and `context/progress-tracker.md` both updated (new "My Bookings" registry entry; tracker checkbox/Completed Features/Current Status all point at Feature 24 next).

## Decisions made

- **No Stripe refund on cancel** — cancelling a `confirmed` booking only flips `status`/`cancelled_at`. Refunds are handled manually outside the app for this MVP (developer's explicit call during `/architect`), consistent with the earlier accepted "no refund automation" stance from Feature 22's expiry-sweep edge case.
- **No time-based cancellation cutoff** — the seed data's per-hotel policy text ("Free cancellation up to 48/24/72 hours before check-in", "Non-refundable within 5/7 days") is decorative only; there's no structured hours/days column backing it. Cancellation eligibility is gated purely by the existing `free_cancellation` boolean (room type overrides hotel default via the tri-state `null`-inherits pattern from Feature 08). Known MVP simplification, not solved further.
- **No "Leave a review" link yet** on `/bookings/[id]` — `/bookings/[id]/review` doesn't exist until Feature 24 builds it; a link to a 404 is worse than no link.
- Only `confirmed` bookings show a cancel action — `pending_payment` already has its own 20-minute expiry sweep with no manual-cancel UI moment; `cancelled`/`completed`/`failed` are terminal.

## Problems solved

- **Real inconsistency caught by `/imprint` and fixed before it shipped**: the first version of `CancelBookingSection`'s destructive button used slightly-off dim classes for the trigger (`border-error/20` + `hover:bg-error-dim/80` instead of `/25` + `hover:bg-error/20`) and invented a wholly new solid `bg-error text-white` variant for the confirm step. Checking the real precedent (`frontend-admin/src/features/room-types/components/RoomTypesSection.tsx`'s "Delete Room Type" flow) showed this codebase has **no solid destructive button anywhere** — both the trigger and any confirm step always use the identical dim `border-error/25 bg-error-dim text-error hover:bg-error/20` classes (the pre-locked "Destructive Button" pattern in `ui-registry.md`). Fixed to match exactly; documented in the new registry entry so it doesn't drift back.
- React's `react-hooks/set-state-in-effect` lint rule (same one Feature 09 hit first) blocked the naive `useEffect(() => setBooking(fetchedBooking), [fetchedBooking])` approach in `BookingDetailPageContent`. Fixed by keeping only a `cancelledBooking` override in local state and merging it with the fetched booking at render time, instead of mirroring the fetch result into state via an effect.

## Current state

Feature 23 fully built and verified end-to-end, not yet committed to git (working tree has the new/modified files, nothing staged — developer hasn't asked for a commit yet). `tsc --noEmit`, `eslint`, and `next build` all clean for both backend and frontend. Real end-to-end verification against the real seeded DB (no mocks): a throwaway test user + real `confirmed` bookings inserted directly (one `free_cancellation: true`-effective, one `false`-effective) — `GET /bookings` returns both correctly sorted with correct `isCancellable`; cancel on the non-eligible one returns 400 with the exact non-refundable message; cancel on the eligible one returns 200 and flips status; a second cancel attempt returns 400; cancelling a nonexistent id returns 404; unauthenticated list/cancel both return 401. Real headless-browser pass (Playwright) confirmed the full visual flow including the corrected destructive-button styling, and the live click-through cancel flow (button → inline confirm → badge updates, no page reload) with zero console errors. All test data (users, bookings) deleted afterward, confirmed no orphaned `session`/`account` rows.

## Next session starts with

**Feature 24 — Review Creation.** Read `build-plan.md`'s section for it. Important gap flagged in `progress-tracker.md`: no booking currently reaches `completed` status automatically anywhere in the codebase — that transition ("check-out date has passed, wasn't cancelled") has no scheduled job built yet. Feature 24 will need to either build that sweep itself or treat it as a prerequisite, similar in spirit to Feature 22's expiry sweep. A review can only be created against a `completed` booking owned by the reviewing user (enforce server-side, not just UI); `/bookings/[id]/review` lets the user create/edit/delete a star rating + description; the hotel's `average_rating`/`review_count` must be recalculated on every write.

## Open questions

- The Feature 16 rating-consistency question (hotel-details header vs. live-computed review numbers) — still carried over, unresolved across eight sessions running now.
- How Feature 24 should trigger the `confirmed`→`completed` transition (scheduled sweep vs. computed-on-read vs. something else) — genuinely open, not yet discussed with the developer.
