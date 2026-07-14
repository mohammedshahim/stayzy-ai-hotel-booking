# Memory — Feature 26 (Admin Booking Actions)

Last updated: 2026-07-14

## What was built

**Feature 26 — Admin Booking Actions (`/bookings/:id` in `frontend-admin` — confirm, cancel, or reallocate a booking):**
- Backend: `GET /admin/bookings/:id` (new `findBookingByIdForAdmin` in `booking.queries.ts`, reuses Feature 25's `AdminBookingSummaryRow` join shape) plus three action routes in `routes/admin/bookings.routes.ts` — `POST /:id/confirm`, `POST /:id/cancel`, `POST /:id/reallocate` (body `{roomTypeId}`, zod-validated via new `reallocateBookingSchema` in `types/booking.schemas.ts`). New query functions: `confirmPendingBookingForAdmin`, `cancelBookingForAdmin`, `lockConfirmedBookingForAdmin`, `reallocateBookingForAdmin` — all conditioned `UPDATE ... WHERE status = X`. New service functions in `booking.service.ts`: `getBookingForAdmin`, `confirmBookingForAdmin`, `cancelBookingForAdmin`, `reallocateBookingForAdmin` (the last wraps a `db.transaction`, locks booking + target room type, validates same-hotel and capacity fit, re-checks live availability via `resolveRoomTypeAvailability`, recomputes `totalPrice`).
- Frontend: `BookingStatusBadge.tsx` extracted as a real shared component (replacing `BookingsListPage`'s inlined status→class maps from Feature 25). New `BookingDetailPage.tsx` (read-only summary card + status-conditional Actions card) and `ReallocateBookingSection.tsx` (room-type `Select` sourced from the existing `useGetRoomTypesQuery(hotelId)` + confirm `Dialog`). `bookingsApi.ts` extended with `getBooking`/`confirmBooking`/`cancelBooking`/`reallocateBooking`. `BookingsListPage` rows now navigate to `/bookings/:id` (`cursor-pointer`, `onClick` → `navigate`).
- `context/progress-tracker.md` and `context/ui-registry.md` both updated (Feature 26 marked complete; current feature advanced to 27 — Admin Dashboard, last feature in Phase 7; new "Admin Booking Detail" registry entry; Feature 25's registry entry annotated to note rows are no longer inert).

## Decisions made

- **"Reallocate" = change the booking's `roomTypeId`**, not move between individually-numbered rooms — the schema has no per-room entity, `room_types.totalInventory` is just a fungible count.
- **Fixed status state machine per action**: Confirm only from `pending_payment`; Cancel from `pending_payment` or `confirmed`; Reallocate only from `confirmed`. Enforced server-side via conditioned `WHERE status = X` updates — a stale UI click 400s instead of corrupting state.
- **Admin cancel is not gated by free-cancellation eligibility** — unlike the guest-facing cancel from Feature 23, an admin can cancel any non-terminal booking regardless of the room type's free-cancellation policy.
- **Reallocation re-checks live availability and silently recomputes price** — no admin price override, no separate preview/quote step; it's a single-step commit (explicit "keep it simple" steer from the developer during `/architect`). No refund/charge automation, matching Feature 23's accepted MVP simplification.
- **Confirm/Cancel/Reallocate all use `frontend-admin`'s own `Dialog`-based confirm pattern** (same one `HotelsListPage` uses for "Delete hotel") — **not** the inline "Are you sure?" block from `frontend/`'s `CancelBookingSection`, which is what the `/architect` plan originally said. Discovered mid-build that `frontend-admin` already had its own destructive-confirm convention; switched to match it for in-app consistency. Flagged to the developer before building, no objection. This `Dialog` pattern is now the canonical confirm-action pattern for `frontend-admin` going forward.
- **Explicit action routes** (`POST /:id/confirm`, `/cancel`, `/reallocate`) rather than one generic `PATCH /:id` with an `action` field — matches the existing owner-facing convention (`POST /bookings/:id/cancel`).

## Problems solved

None this session — no bugs found by `/review` (skill wasn't invoked; verification was done directly via curl + Playwright inline in this session rather than through the `/review` skill). All guard-rail edge cases (already-confirmed, already-cancelled, same-room-type reallocate, overbooked target, undersized capacity, malformed UUID, unauthenticated) were verified correct on the first pass.

## Current state

Feature 26 fully built and verified — not yet committed to git (working tree has the new/modified files, nothing staged). `tsc --noEmit` clean for both `backend` and `frontend-admin`. `oxlint` clean for `frontend-admin` (backend has no lint tooling configured at all — confirmed, not an oversight). Production build clean for `frontend-admin`. Verified against the real seeded DB using a throwaway test user + 9 directly-inserted test bookings spanning every status/transition (not the real seed data) — every action and every guard rail confirmed correct via curl, then the full click-through UI verified via headless Playwright with zero console errors. All test data (bookings, user, session, account) deleted afterward; real booking count confirmed back to baseline (33).

## Next session starts with

**Feature 27 — Admin Dashboard** (last feature in Phase 7 — Admin Operations). Read `build-plan.md`'s section for it: `/dashboard` (admin) — total bookings, revenue, occupancy rate, cancellation rate, recent bookings feed, top hotels, upcoming check-ins/check-outs. Test criterion: with seeded booking data across multiple hotels and statuses, all dashboard metrics must compute correctly against the raw data. Note the admin router currently has a placeholder at `/` ("Admin dashboard arrives in Feature 27.") in `frontend-admin/src/router/routes.tsx` — that's the route to replace.

## Open questions

- The Feature 16 rating-consistency question (hotel-details header vs. live-computed review numbers) — carried over across many sessions, should now be mostly moot since Feature 24 keeps `hotels.average_rating`/`review_count` genuinely in sync on every real review write, but can still diverge for any pre-existing hotel whose stored rating was never backed by a real review row. Not yet re-verified.
- Whether to retrofit the fetch-error-state pattern (added to `BookingsListPage` in Feature 25) onto `HotelsListPage` and other existing admin lists — not blocking, flagged in `ui-registry.md`.
- Whether to retrofit `frontend/`'s `Input` primitive with the `text-foreground` fix applied to `frontend-admin`'s copy in Feature 25 — currently dormant (no native date input exists in `frontend/` yet), apply the moment one appears.
