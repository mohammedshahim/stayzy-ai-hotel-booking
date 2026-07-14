# Memory — Feature 28 (Skeleton Loading)

Last updated: 2026-07-14

## What was built

**Feature 28 — Skeleton Loading** (search results, hotel details, favorites, compare, bookings, both admin list views — hotel details and checkout were already done in Features 12/21 and needed no changes):

7 new bespoke skeleton components, each following the locked `bg-subtle animate-pulse rounded-*` recipe (radius always matching the real element's own radius), wired into the first-load `isLoading` branch of their page:
- `frontend/features/search/components/{HotelCardSkeleton,SearchResultsSkeleton}.tsx` → wired into `SearchPageContent.tsx` (grid/list card skeletons sized to `RESULTS_PER_PAGE`=9, plus a single pulsing rectangle for Map view's first load)
- `frontend/features/favorites/components/FavoritesSkeleton.tsx` → `FavoritesPageContent.tsx`
- `frontend/features/compare/components/CompareSkeleton.tsx` → `ComparePageContent.tsx` (column count driven by the real `ids.length` from `useCompareSelection()`, not a guess)
- `frontend/features/booking/components/BookingsListSkeleton.tsx` → `BookingsPageContent.tsx`
- `frontend-admin/src/features/hotels/components/HotelsTableSkeleton.tsx` → `HotelsListPage.tsx`
- `frontend-admin/src/features/bookings/components/BookingsTableSkeleton.tsx` → `BookingsListPage.tsx`
- `frontend-admin/src/features/dashboard/components/DashboardSkeleton.tsx` → `DashboardPage.tsx` (closes the gap flagged in Feature 27's notes)

`context/progress-tracker.md` and `context/ui-registry.md` both updated (Feature 28 marked complete, current feature advanced to 29 — Empty States; per-component notes appended to the 7 existing relevant entries; the master "Loading Skeleton" Approved Pattern entry enriched with the radius-matching corollary and updated to reflect 9 total components now sharing it).

## Decisions made

- **First-load only** — no hook/query changes anywhere. Every view's existing loading-state logic (search's `isLoading && !isEmpty` dim-to-`opacity-60` on refetch, admin's full swap on param change) is untouched; only the "no data yet" visual changed from text/blank to a shaped skeleton.
- **Bespoke per-page components, no shared `<Skeleton>` primitive** — continues the exact precedent `HotelDetailsSkeleton`/`CheckoutSkeleton` set in Features 12/21, rather than introducing a new abstraction.
- **Skeleton radius always matches the real element's radius** (`rounded-2xl` for images/panels, `rounded-lg` for small thumbnails, `rounded-full` for pill/avatar shapes, `rounded-xl` for text bars) — this corollary to the locked "Loading Skeleton" pattern is now explicit in `ui-registry.md` rather than just implicit precedent.
- Fixed placeholder counts used where the real count is unknown pre-fetch (6 for favorites/bookings-list/admin-tables, `RESULTS_PER_PAGE`=9 for search) — except Compare, which uses the real `ids.length` since that's known synchronously.

## Problems solved

- Heavy CDP network throttling in Playwright verification starved Next.js dev-mode's (Turbopack, unbundled) JS chunks entirely, making a page appear to render pre-hydration static HTML with no skeleton — looked like a bug but was a test-harness artifact, not a real defect. Fixed by throttling only the specific API route (`page.route` with an artificial delay) instead of the whole network connection, keeping JS chunk loading fast. Worth remembering for any future throttled-network verification in this repo's dev mode.

## Current state

Feature 28 fully built and verified — not yet committed to git (working tree has the new/modified files, nothing staged). `tsc --noEmit` clean for both `frontend` and `frontend-admin`. Lint clean (`eslint` for `frontend`, `oxlint` for `frontend-admin` — only the same 3 pre-existing shadcn-file warnings, none new). Production build clean for both. Verified live in-browser via Playwright with throttled network: every view (search grid/list/map, favorites, compare, user bookings, admin hotels table, admin bookings table, admin dashboard) shows its shaped skeleton on first load with no blank flash, and correctly resolves to real data afterward. Zero console errors across every page checked. A throwaway test account created for verification was deleted afterward (confirmed no orphaned session/account rows left behind), and the ad-hoc frontend dev server started for testing was stopped.

## Next session starts with

**Feature 29 — Empty States** (last feature before Phase 8's final item, Feature 30 Responsive Pass). Read `build-plan.md`'s section for it: empty states wherever a list can legitimately be empty. Note several already exist from earlier features (search's "No hotels match these filters", favorites' "No favorites yet", compare's "No hotels to compare yet", bookings' "No bookings yet", admin Hotels' "No hotels yet", admin Bookings' "No bookings found") — this is likely mostly an audit/consistency pass rather than net-new work. Check specifically whether reviews has an empty state yet (not confirmed either way this session).

## Open questions

- **Leftover "Temp User 1" test data in the dev DB** (bookings against Hotel Marais Charme, dated ~2026-07-13) — surfaced again this session (visible in a dashboard screenshot taken during verification), still not deleted, still awaiting the developer's decision. Flagged repeatedly across Features 26/27/28 now.
- The Feature 16 rating-consistency question (hotel-details header vs. live-computed review numbers) — carried over across many sessions, likely mostly moot since Feature 24 keeps `hotels.average_rating`/`review_count` genuinely in sync on every real review write, but can still diverge for any pre-existing hotel whose stored rating was never backed by a real review row. Not yet re-verified.
- Whether to retrofit the fetch-error-state pattern (added to admin `BookingsListPage` in Feature 25) onto `HotelsListPage` and other existing admin lists — not blocking, flagged in `ui-registry.md`.
- Whether to retrofit `frontend/`'s `Input` primitive with the `text-foreground` fix applied to `frontend-admin`'s copy in Feature 25 — currently dormant (no native date input exists in `frontend/` yet), apply the moment one appears.
