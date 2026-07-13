# Memory — Feature 24 (Review Creation)

Last updated: 2026-07-13

## What was built

**Feature 24 — Review Creation (full CRUD, plus the prerequisite completion sweep):**
- Backend completion sweep: `completePastConfirmedBookings` (`booking.queries.ts`, conditioned `UPDATE bookings SET status='completed' WHERE status='confirmed' AND check_out < today`), wrapped by `booking.service.ts`'s `completePastBookings`, exposed as its own dedicated `POST /bookings/complete-past` (behind `requireCronSecret`, same middleware as `/bookings/expire-stale` but a separate named route, not folded into it).
- Backend review CRUD: `GET/POST/PATCH/DELETE /bookings/:id/review` in `bookings.routes.ts`/`bookings.controller.ts` (booking-scoped, not a separate `/reviews/:id` resource). New query functions in `reviews.queries.ts`: `findReviewByBookingIdForOwner`, `insertReview`, `updateReviewByBookingIdForOwner`, `deleteReviewByBookingIdForOwner`, `recalculateHotelRatingStats` (full `AVG`/`COUNT` SQL aggregate, run inside the same transaction as every write). New service functions in `review.service.ts`: `getOwnReviewForBooking`, `createReviewForBooking` (404 if booking not owned, 400 if not `completed`, catches the `23505` unique-violation on `reviews.booking_id` and surfaces it as "already reviewed"), `updateReviewForBooking`, `deleteReviewForBooking`. New `writeReviewSchema` in `review.schemas.ts` (rating 1–5, non-empty description).
- `booking.queries.ts`'s `BookingSummaryRow`/`booking.service.ts`'s `BookingSummary` gained a `review: { id, rating } | null` field (`LEFT JOIN reviews`) — same "backend collapses logic, frontend never re-derives" precedent as Feature 23's `isCancellable`.
- Frontend: `StarRating.tsx` extended with an optional `onChange` prop (interactive radiogroup mode, `h-6 w-6` stars) instead of a new component. New `frontend/components/ui/textarea.tsx` (didn't exist yet in the user app; ported from `frontend-admin`'s). New `frontend/features/reviews/` additions: `types.ts`, `hooks/useSubmitReview.ts` (one hook, handles both create/edit via a `mode` param), `hooks/useDeleteReview.ts`, `hooks/useOwnReview.ts` (fetches the full review for edit-mode prefill), `components/ReviewForm.tsx`, `components/ReviewPageContent.tsx`, `components/ReviewEntryPoint.tsx`. New route `frontend/app/bookings/[id]/review/page.tsx` (same server-guard pattern as `/bookings/[id]`). `BookingDetailPageContent.tsx` now renders `ReviewEntryPoint`.
- `context/progress-tracker.md` and `context/ui-registry.md` both updated (Feature 24 marked complete, Phase advanced to 7 — Admin Operations / Feature 25 next; new "Review Creation" registry entry; "Star Rating" locked pattern annotated with the new interactive variant).

## Decisions made

- **`confirmed`→`completed` is a real DB-writing sweep**, not computed-on-read — keeps `bookings.status` truthful for other code that already branches on it (`availability.service.ts`'s `HELD_BOOKING_STATUSES` already listed `completed`, designed-for but unreachable until now). Exposed as its own dedicated route (`/bookings/complete-past`) rather than reusing `/bookings/expire-stale`.
- **Review routes are booking-scoped**, matching the cancel-action precedent — no separate review-id resource needed since `reviews.booking_id` is schema-unique (one review per booking).
- **`hotels.average_rating`/`review_count` are fully recomputed on every write**, not incrementally adjusted — simpler, can never drift, accepted cost of one extra aggregate query per (low-frequency) write.
- **Interactive star input extends `StarRating.tsx`** rather than being a new component — keeps fill-state styling in one place.
- Review form/hooks/components live in `frontend/features/reviews/` (the existing display-feature folder), not `features/booking/` — they operate on the `Review` entity.

## Problems solved

- **Real race caught during the Playwright verification pass, not shipped**: an `enabled`-gated optimization in `useOwnReview` (skip fetching the full review when `BookingSummary.review` already says none exists — avoids a guaranteed-404 request on every first "Leave a review" visit) broke the edit-mode prefill. When `enabled` flipped false→true, the hook's loading flag didn't re-arm (its `forId` tracker only kept the disabled branch's already-resolved id), so `ReviewForm` mounted with `existingReview` still `null` before the real fetch resolved — and since `ReviewForm`'s rating/description are seeded via `useState`'s one-time default, the edit form silently rendered empty. Fixed by keying the loading tracker on `` `${bookingId}:${enabled}` `` instead of just `bookingId`, so a false→true flip is treated as a fresh fetch needing its own loading state.
- Hit the same `react-hooks/set-state-in-effect` lint trap Features 09/23 hit (in the disabled branch of that same hook) — fixed by deriving the disabled-branch result directly at render time instead of calling `setState` synchronously inside the effect body.
- Base UI's `Button` always reports `role="button"` in the accessibility tree even when `render={<Link .../>}` renders an `<a>` under the hood — tripped up the first Playwright pass (`getByRole('link', ...)` timed out even though the element was visible). Query these as buttons, not links, in any future test.

## Current state

Feature 24 fully built and verified end-to-end, not yet committed to git (working tree has the new/modified files, nothing staged). `tsc --noEmit` clean for backend; `tsc --noEmit`/`eslint`/`next build` clean for frontend including the new `/bookings/[id]/review` route in the build output. Verified against the real seeded DB (no mocks, throwaway test user via `POST /api/auth/sign-up/email`): the completion sweep correctly transitions only past-checkout `confirmed` bookings and rejects unauthorized/unsecreted calls; review create/edit/delete all correctly gate on ownership + `completed` status, reject duplicates, and recompute `hotels.average_rating`/`review_count` correctly at every step (verified numerically, including reset to 0/0 after delete). Real headless-browser pass (Playwright) confirmed the full click-through: Leave a review → star + textarea form → submit → detail page shows Edit your review → edit page correctly prefills → delete (inline confirm) → reverts to Leave a review — zero console errors after the race-condition fix above. All test data (bookings, review, session, account, user) deleted afterward, confirmed no orphaned rows and hotel stats back to 0/0.

## Next session starts with

**Feature 25 — Admin Booking List** (Phase 7 — Admin Operations). Read `build-plan.md`'s section for it: `/bookings` in `frontend-admin`, filterable by status, hotel, and date range, against the real seeded + test booking data.

## Open questions

- The Feature 16 rating-consistency question (hotel-details header vs. live-computed review numbers) — carried over across many sessions. Should now be mostly moot going forward since Feature 24 keeps `hotels.average_rating`/`review_count` genuinely in sync on every real review write, but it can still diverge for any pre-existing hotel whose stored rating was never backed by a real review row. Worth a quick sanity check next session, not yet re-verified.
