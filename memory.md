# Memory — Feature 16 (Reviews Display) + surfaced rating-consistency gap

Last updated: 2026-07-11

## What was built

**Feature 16 — Reviews Display:**
- Backend: `GET /hotels/:id/reviews?page&pageSize` (`hotels.controller.ts`'s `getHotelReviews`, mounted in `hotels.routes.ts` alongside `/similar`/`/room-types`). New `backend/src/services/review.service.ts` (`getHotelReviews`) and `backend/src/queries/reviews.queries.ts` (`countReviewsByHotel`, `getRatingBreakdown`, `findReviewsByHotel` — the last joins `user` for reviewer name/avatar). New `backend/src/types/review.schemas.ts` (`hotelReviewsQuerySchema`, page/pageSize, default pageSize 5). New response types in `backend/src/models/booking.schema.ts`: `ReviewListItem`, `RatingBreakdown`, `PaginatedReviews`, `HotelReviewsResult`.
- Frontend: new `frontend/features/reviews/` — `hooks/useHotelReviews.ts` (fetch page 1 on mount, `loadMore()`/`hasMore` accumulate subsequent pages), `components/{RatingBreakdown,ReviewListItem,ReviewsSection}.tsx`. New types in `frontend/features/hotel-details/types.ts` (`Review`, `RatingBreakdown`, `PaginatedReviews`, `HotelReviewsResult`). Wired into `HotelDetailsContent.tsx` **between `PoliciesSection` and `SimilarHotelsSection`** — matches `ui-rules.md`'s already-locked Hotel Details Layout order ("description, amenities, room list, reviews, similar hotels"), which the two prior features (14/15) hadn't actually needed to follow yet since nothing came after Similar Hotels before.
- Seed data: `backend/src/config/seed.ts` gained 3 additive-only demo reviewer `user` rows (fixed ids, `onConflictDoNothing`) and 8 synthetic `bookings`+`reviews` rows across 2 of the 5 hotels (Hotel Marais Charme: 6 reviews spanning 2 pages; Midtown Manhattan Hotel: 2 reviews). The other 3 hotels intentionally have zero reviews to exercise the empty state. `seedHotels` now returns a `Map<slug, {hotelId, roomTypeId}>` for the new `seedReviews` to consume. Confirmed idempotent (`pnpm seed` run twice, identical output).
- Docs updated: `context/progress-tracker.md` (Completed Features entry, 3 new Architecture Decisions, Session Notes entry, Current Status now pointing at Phase 4 / Feature 17 Favorites), `context/ui-registry.md` (new `ReviewsSection`/`RatingBreakdown`/`ReviewListItem` entry), `context/architecture.md` (new "Reviews — Display (Feature 16)" data-flow section; renamed the pre-existing aspirational one to "Reviews — Submission (Feature 24, not yet built)" to disambiguate; annotated the `reviews.routes.ts` file-tree line to note Feature 16's endpoint actually lives in `hotels.routes.ts`).

## Decisions made

- `GET /hotels/:id/reviews` computes the rating breakdown/average **live** from real `reviews` rows, falling back to the hotel's stored `hotels.averageRating`/`reviewCount` (empty breakdown/list) when none exist — **never writes back to `hotels`**. Confirmed explicitly with the developer: the seed script/endpoint must not modify or delete any existing hotel records.
- Pagination is a "Load more" button (accumulates pages client-side), not the shared numbered `Pagination` component — that component swaps the visible page rather than accumulating, which reads wrong for a reviews list. Confirmed with the developer before building.
- Empty state (hotel with zero real reviews) uses the locked `EmptyState` pattern ("No reviews yet"), not the render-nothing precedent `SimilarHotelsSection` uses — reviews are primary page content, not a supplementary recommendation. Confirmed with the developer.
- **Known, explicitly accepted tradeoff going in:** because the endpoint never writes to `hotels`, the hotel details page header (Feature 12, unchanged) and search-results cards (Feature 09, unchanged) still read `hotels.averageRating`/`reviewCount` directly — which is frozen at 0 for every hotel (including the 2 with real seeded reviews) since nothing has ever written a real value there. Developer said "im ok with that" when this was raised during `/architect`, before seeing it live.

## Problems solved

- The seed data ordering problem: `reviews.booking_id` is a required, unique FK to `bookings`, but Booking Creation (Feature 19) doesn't exist yet. Solved by having `seed.ts` insert synthetic demo-reviewer `user` rows + synthetic `bookings` rows purely to satisfy the FK chain — additive-only, no existing rows touched, idempotent via `onConflictDoNothing` on the `user` inserts (the `bookings`/`reviews` inserts are naturally idempotent since they get swept up in the existing `TRUNCATE ... CASCADE` on `hotels` and recreated fresh each run).
- Avoided the `react-hooks/set-state-in-effect` ESLint trap in `useHotelReviews.ts` by matching `useSimilarHotels.ts`'s exact `forId`-comparison pattern (no synchronous `setState` at the top of the effect) instead of resetting state before the fetch.

## Current state

Feature 16 is fully built, verified, and documented — **uncommitted**. Verified end-to-end: `tsc --noEmit`/`pnpm build` clean (backend), `tsc --noEmit`/`eslint`/`next build` clean (frontend), `pnpm seed` idempotent on repeat, direct `curl` confirmed both the real-review and stored-fallback response shapes, real Playwright pass confirmed the breakdown/pagination/"Load more"/empty-state render correctly with zero console errors at desktop and 390px mobile widths.

**A `/review` pass surfaced a real, if previously-agreed-to, UX problem** (not yet fixed, no decision made on which option to take): the accepted header/listing-card mismatch is more jarring in practice than anticipated — on Hotel Marais Charme's own details page, the header reads "0.0 Pleasant · 0 reviews" while the accurate Reviews section a few hundred pixels below reads "4.3 · 6 reviews" for the exact same hotel. The same stale `hotels.averageRating`/`reviewCount` also affects `/search` result cards and `SimilarHotelsSection` cards (all read `hotels.averageRating`/`reviewCount` directly, none touched by Feature 16). Confirmed the "Pleasant" label itself is not a bug — it's a normal derived qualitative tier (`getGuestRatingLabel()` in `frontend/features/search/lib/guest-rating.ts`, not a stored field) that will work correctly once the underlying number is real; it just looks broken today because every hotel is stuck at `0.0`.

Three remediation options were presented to the developer, none implemented yet:
1. Leave as-is until Feature 24 (real review submission) naturally starts keeping `hotels` in sync.
2. Fix just the hotel details page header (`GET /hotels/:id`, Feature 12) to prefer live-computed numbers when real reviews exist for that hotel — smallest fix for the most visible inconsistency.
3. Fix everywhere — also extend live-compute-with-fallback to `/search` (Feature 09) and `SimilarHotelsSection` — larger blast radius, touches two previously-shipped, previously-reviewed features.

Dev servers were left running: backend :4000, frontend :3000, frontend-admin :5173 — may or may not still be up depending on machine state between sessions.

## Next session starts with

Ask the developer which remediation option (1/2/3 above) they want for the rating-consistency gap before doing anything else — this was left as an open decision, not yet answered. Once resolved (or explicitly deferred), the next options are:
- Commit Feature 16 (and whichever remediation was chosen).
- Feature 17 — Favorites, per `progress-tracker.md`'s "Next up": favorite toggle on hotel cards/details, guest favorites via session cookie, `/favorites` page, guest→account merge reusing the Feature 10 `hooks.after` merge point in `config/auth.ts`.

## Open questions

- Which of the 3 rating-consistency remediation options (if any) the developer wants — unresolved, surfaced this session via `/review`, no decision made yet.
- Whether to commit the current uncommitted Feature 16 changes — not yet asked this session (differs from last session, where committing was the explicit open question; this time the rating-consistency question takes priority since it may change what gets committed).
