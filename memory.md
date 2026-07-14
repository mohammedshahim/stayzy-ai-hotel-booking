# Memory — Feature 25 (Admin Booking List)

Last updated: 2026-07-14

## What was built

**Feature 25 — Admin Booking List (`/bookings` in `frontend-admin`, filterable by status/hotel/check-in date range, server-side pagination):**
- Backend: `GET /admin/bookings` — new `routes/admin/bookings.routes.ts` (behind `requireAdmin`) → `controllers/admin/bookings.controller.ts`'s `listBookings` (parses `page`/`pageSize`/`status`/`hotelId`/`checkInFrom`/`checkInTo` off `req.query`, no zod schema, invalid values just dropped) → `booking.service.ts`'s new `listBookingsForAdmin` (validates `status` against the known enum, silently drops anything invalid) → `booking.queries.ts`'s new `findBookingsForAdmin`/`AdminBookingSummaryRow` — a dedicated admin projection (not a reuse of the owner-facing `BookingSummaryRow`), joins `hotels`/`roomTypes`/`hotelImages`/`user` (for `guestName`/`guestEmail`), dynamic `and(...)` WHERE built only from supplied filters, same `{ items, total }` shape as `listHotels`. Registered in `routes/index.ts`.
- Frontend: new `frontend-admin/src/features/bookings/` — `types.ts` (`AdminBookingListItem`, `BookingStatus`, `ListBookingsParams`), `bookingsApi.ts` (RTK Query, registered in `app/store.ts`), `components/BookingsListPage.tsx`. Filter bar: Status/Hotel `Select` (hotel options from `useGetHotelsQuery({ page: 1, pageSize: 100 })`, reusing the existing admin hotels endpoint rather than a new one) + two `type="date"` `Input`s (Check-in from/to, cross-constrained with `min`/`max`) + conditional "Clear filters". Table/pagination/status-badge/empty-state all reuse `HotelsListPage`'s exact locked patterns and the existing Booking Status Badge family byte-for-byte. Wired into `router/routes.tsx` (`/bookings`) and `Sidebar.tsx` (flipped `enabled: true`, "Soon" badge removed). Rows are inert — no link to a detail page, since `/bookings/:id` (admin) doesn't exist until Feature 26.
- `context/progress-tracker.md` and `context/ui-registry.md` both updated (Feature 25 marked complete; current feature advanced to 26 — Admin Booking Actions; new "Admin Bookings List" registry entry; canonical Input pattern entry updated with the bug/fix below).

## Decisions made

- **New `AdminBookingSummaryRow` type/query**, not a reuse of `BookingSummaryRow` — admin needs guest identity (name/email), not review state.
- **Filtering and pagination are server-side** (`GET /admin/bookings?status=&hotelId=&checkInFrom=&checkInTo=&page=&pageSize=`), matching `listHotels`'s existing shape — scales correctly, avoids the "what does page 2 mean after client-side filtering" problem.
- **Hotel filter dropdown reuses `GET /admin/hotels`** with a larger `pageSize` rather than a new "list all hotels" endpoint — fine at current seeded scale (well under 100 hotels), revisit if that ever changes.
- **Date range filters on `checkIn`, not `createdAt`** — an operational "who's arriving when" view, not a booking-activity view.
- **No query-param zod schema** — controller-level coercion, invalid values silently dropped, matching `listHotels`'s existing (unvalidated) convention.
- **Rows don't link anywhere yet** — deliberate, `/bookings/:id` (admin) is Feature 26's job.

## Problems solved

- **Critical bug, found via `/review` and fixed same session**: the shared `Input` primitive (`frontend-admin/src/components/ui/input.tsx`) had no explicit text-color class — relied on inherited `color`. That inheritance holds for typed text but Chromium's native `<input type="date">` doesn't reliably respect it; the selected check-in date rendered in the page's own background color (`rgb(251,246,239)` == `--bg-base`), effectively invisible. Confirmed via computed-style inspection (not just eyeballing a screenshot) — every ancestor up to `<body>` computed the correct near-black text color; only the `<input>` itself flipped. Fixed by adding `text-foreground` to the base class. This also retroactively fixed `RateOverrideManager`'s two pre-existing date inputs (same latent bug, never noticed before). **`frontend/components/ui/input.tsx` has the identical gap and is currently dormant** (no native date input exists in that app yet — its date picker is a Calendar/Popover component) — apply the same one-line fix there the moment a native date/time input shows up.
- Two more minor gaps caught in the same `/review` pass, both fixed: no `min`/`max` cross-constraint between the two date filters (added, matching `RateOverrideManager`'s existing precedent); no error state for a failed `GET /admin/bookings` request (added an `isError` branch distinct from the empty-results state — first real fetch-error UI in either app's list pages; every other admin table, including `HotelsListPage`, still lacks this and could use the same retrofit later).

## Current state

Feature 25 fully built, reviewed, fixed, and re-verified — not yet committed to git (working tree has the new/modified files, nothing staged). `tsc --noEmit` clean for both `backend` and `frontend-admin`; `oxlint` clean (no new warnings beyond pre-existing unrelated ones); production build clean. Verified against the real seeded DB (33 real bookings, no mocks): every filter (status/hotel/date range) individually and in combination narrows correctly via direct curl checks, pagination is gap-free (20+13=33, no overlap), invalid status silently ignored, unauthenticated request correctly 401s. Real headless-browser pass (Playwright) confirmed the UI end-to-end including the three post-review fixes: date text now renders legibly, the min/max constraint is wired, and a simulated 500 shows the new "Couldn't load bookings" error state instead of a silently-empty table.

## Next session starts with

**Feature 26 — Admin Booking Actions** (Phase 7 — Admin Operations). Read `build-plan.md`'s section for it: `/bookings/[id]` (admin) — confirm, cancel, or reallocate to a different room of the same type. Cancelling must release held inventory back to availability (test criterion: cancel from the admin panel and confirm the room type's availability increases for the affected dates). This is also the first place an admin detail page needs to exist — `BookingsListPage`'s rows are currently inert and were deliberately left that way pending this feature.

## Open questions

- The Feature 16 rating-consistency question (hotel-details header vs. live-computed review numbers) — carried over across many sessions, should now be mostly moot since Feature 24 keeps `hotels.average_rating`/`review_count` genuinely in sync on every real review write, but can still diverge for any pre-existing hotel whose stored rating was never backed by a real review row. Not yet re-verified.
- Whether to retrofit the new fetch-error-state pattern onto `HotelsListPage` and any other existing admin list — not blocking, flagged in `ui-registry.md` for whenever that's revisited.
