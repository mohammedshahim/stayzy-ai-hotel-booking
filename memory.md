# Memory — Feature 27 (Admin Dashboard)

Last updated: 2026-07-14

## What was built

**Feature 27 — Admin Dashboard (`/dashboard`, i.e. the `frontend-admin` root route `/` — date-range-filterable KPIs, top hotels, recent bookings, upcoming check-ins/check-outs):**
- Backend: single aggregate endpoint `GET /admin/dashboard?checkInFrom=&checkInTo=` (`routes/admin/dashboard.routes.ts` behind `requireAdmin`, `controllers/admin/dashboard.controller.ts`) backed by new `services/dashboard.service.ts`'s `getAdminDashboard`. New `queries/dashboard.queries.ts`: `findDashboardBookingStats` (single SQL aggregate with `FILTER (WHERE ...)` for total/cancelled/revenue, plus a `LEAST/GREATEST`-clipped room-nights sum for occupancy's numerator), `findPublishedRoomInventoryTotal`, `findTopHotelsByBookingCount`. Three new functions colocated in `booking.queries.ts` reusing the existing `adminBookingColumns` projection: `findRecentBookingsForAdmin`, `findUpcomingCheckInsForAdmin`, `findUpcomingCheckOutsForAdmin`. `utils/date.ts` gained `addDaysIso`/`firstOfMonthIso`.
- Frontend: new `frontend-admin/src/features/dashboard/` (`types.ts`, `dashboardApi.ts` RTK Query slice, `components/DashboardPage.tsx`), wired into the store, router (`/`, replacing the placeholder), and Sidebar (flipped `enabled: true`, added `end={item.href === "/"}` to its `NavLink` so it doesn't stay highlighted on every route).
- `context/progress-tracker.md` and `context/ui-registry.md` both updated (Feature 27 marked complete, Phase 7 — Admin Operations fully done; current feature advanced to 28 — Skeleton Loading, first feature of Phase 8; new "Admin Dashboard" registry entry).

## Decisions made

- **Date-range filterable**, not a fixed all-time snapshot. Filter is on **stay dates** (`checkIn`/`checkOut` overlap via the same `LEAST/GREATEST`-clipped logic `availability.service.ts` already uses), not booking creation date — "revenue in this period" means stays happening in that period. Default range on load: 1st of current month → today.
- **"Recent bookings" and "Upcoming check-ins/check-outs" are deliberately independent of the date-range filter** — always latest-10-by-`createdAt` / always-next-7-days-from-today. Only the 4 stat cards + Top Hotels respect the filter. Verified in-browser: widening the range changes only those, not the two feeds.
- **Occupancy rate formula**: numerator = booked room-nights from held-status bookings (`pending_payment`/`confirmed`/`completed`) clipped to the selected range; denominator = `sum(totalInventory)` across non-deleted room types on **published** hotels only (drafts excluded) × nights in range. Deliberately mirrors `availability.service.ts`'s existing per-night logic rather than a separate approximation.
- **Top hotels ranks by booking count**, not revenue (developer's explicit override of the initial revenue-ranked proposal during `/architect`) — revenue shown alongside each row as secondary context. Both scoped to `confirmed`+`completed` bookings only.
- **Date-range filter UI reuses `BookingsListPage`'s plain `type="date"` `Input` pair convention**, not the `frontend/` Calendar-popover pattern — `frontend-admin` already had its own date-range filter convention, matched that instead of importing from the other frontend.
- **Stat cards use the pre-locked "Stat Card" pattern** from `ui-registry.md`'s Approved Patterns section (`bg-elevated`, `shadow-card`, number-then-label) — first real usage of that pattern anywhere in the app; caught and fixed mid-build after an initial version used ad-hoc classes instead.

## Problems solved

- Initially styled the stat cards with invented classes (`bg-surface`, no shadow, `font-semibold`); caught during the post-build `ui-registry.md` update pass that a locked "Stat Card" pattern already existed and didn't match. Fixed to the exact locked classes before finishing.
- No local Playwright install in either frontend/backend package — resolved by invoking the npx-cached playwright package directly via its `index.mjs`/`cli.js` paths (`~/.npm/_npx/<hash>/node_modules/playwright/`) rather than adding it as a project dependency.

## Current state

Feature 27 fully built and verified — not yet committed to git (working tree has the new/modified files, nothing staged). `tsc --noEmit` clean for both `backend` and `frontend-admin`. `oxlint` clean for `frontend-admin` (3 pre-existing shadcn-file warnings only, none new). Production build clean. Verified against the real dev DB (no throwaway test data needed — used existing data as-is): every KPI hand-computed via direct `psql` queries and matched the API exactly for the default month-to-date range. Headless Playwright pass: zero console errors, date-range widening correctly refetches only the filtered widgets, row-click navigation to `/bookings/:id` confirmed working.

## Next session starts with

**Feature 28 — Skeleton Loading** (first feature of Phase 8 — Polish; Phase 7 — Admin Operations is now fully complete). Read `build-plan.md`'s section for it: skeleton states added to search results, hotel details, favorites, compare, bookings, and both admin list views. Note: the Dashboard built this session currently only shows a plain "Loading dashboard..." text line while fetching — worth including in this pass alongside the admin list views, even though the build-plan's Feature 27 description didn't call it out by name.

## Open questions

- **Leftover test data in the dev DB**: a "Temp User 1" account with several bookings against Hotel Marais Charme (dated ~2026-07-13) is still present, even though Feature 26's session notes claimed test data was cleaned up. Flagged to the developer during this session — they haven't yet said whether to delete it or leave it. Surface this again next session if still unresolved.
- The Feature 16 rating-consistency question (hotel-details header vs. live-computed review numbers) — carried over across many sessions, likely mostly moot since Feature 24 keeps `hotels.average_rating`/`review_count` genuinely in sync on every real review write, but can still diverge for any pre-existing hotel whose stored rating was never backed by a real review row. Not yet re-verified.
- Whether to retrofit the fetch-error-state pattern (added to `BookingsListPage` in Feature 25) onto `HotelsListPage` and other existing admin lists — not blocking, flagged in `ui-registry.md`.
- Whether to retrofit `frontend/`'s `Input` primitive with the `text-foreground` fix applied to `frontend-admin`'s copy in Feature 25 — currently dormant (no native date input exists in `frontend/` yet), apply the moment one appears.
