# Memory — Feature 30 (Responsive Pass)

Last updated: 2026-07-15

## What was built

Feature 30 — Responsive Pass, the last item of Phase 8 (Polish). Full responsive audit of both frontends via real headless-browser (Playwright, ad hoc, not a project dependency) passes against the always-running dev servers and real seeded DB data. `frontend/` checked at mobile (375px)/tablet (768px)/desktop (1280px); `frontend-admin` checked at tablet (768px)/desktop (1280px) only (see scope decision below). Most of both apps already held up cleanly (`FilterSidebar`, `HotelDetailsContent`, `CheckoutPageContent`, admin dashboard, hotel form, room types accordion). Three real gaps found and fixed:

- `frontend/features/compare/components/CompareTray.tsx` — the floating tray's avatars/label/Compare/close row had zero responsive classes and crowded at mobile widths. Changed to `flex-col gap-3 sm:flex-row sm:items-center` (avatars+label group above a full-width Compare/close row below `sm:`, one row at `sm:`+), matching the `RoomTypeCard`/`BookingListCard` stack-then-row convention.
- `frontend/features/search/components/HotelCard.tsx`'s `list` variant (used both by `/search`'s List view toggle and by `MapView`'s side list) was a fixed `flex-row` with a hardcoded 224px image regardless of viewport — at 375px this severely clipped hotel names/tags/price ("Hotel Mara...", "Se[e availability]"). Fixed: outer `flex-col sm:flex-row`, image `w-full sm:w-56 md:w-64`, dropped the image's own now-redundant conditional rounding classes (outer wrapper's `overflow-hidden rounded-2xl` already clips regardless of stack direction).
- `frontend-admin/src/components/layout/AppShell.tsx` — the real find of the session. The `flex-1` content column next to `Sidebar` had no `min-w-0`, the classic flexbox bug where a flex item won't shrink below its content's intrinsic width. At 768px this let the *entire page* (sidebar included) grow to whatever width the widest table needed (1041px on Hotels, 1263px on Bookings) instead of containing the overflow to the table's own `overflow-x-auto` region. One-line fix (`min-w-0` added), confirmed it resolved both list pages at once.

`context/progress-tracker.md` and `context/ui-registry.md` both updated: Feature 30 marked complete with a full Completed Features entry, current feature advanced to 31 (Environment Variables — first item of Phase 9, Deployment; Phase 8 is now fully closed), and the `CompareTray`/`HotelCard`/`AppShell` registry entries each got an inline "Feature 30 fix" note (this repo's registry is prose-based with dated inline notes, not tables — followed that convention rather than the generic `/imprint` table template).

## Decisions made

- **`frontend-admin` is scoped to tablet + desktop only, not phone width** (confirmed with the developer during `/architect`) — it's an internal staff tool, not guest-facing, so no hamburger/drawer nav was built to collapse the always-visible fixed `w-60` `Sidebar`. That component is untouched below tablet width by design, not an oversight. If a future feature ever needs real phone support for admin, building that drawer is net-new UI, not a fix.
- **"Full responsive audit" = fix what's broken, not add new capability** (language aligned during `/architect`) — this is why the admin table columns (which rely on horizontal scroll, not card-reflow) were left alone: they don't literally break at 768px, and phone-width admin support was explicitly out of scope.
- **`CompareTray`'s mobile treatment is `flex-col sm:flex-row`, not a "just tighten the single row" shrink** (developer's explicit call) — reuses the established stack-then-row convention rather than a fragile approach that would break again with a longer selection-count string.
- **Mobile = 375px, tablet = 768px, desktop = 1024px+ (the `lg:` breakpoint already in use everywhere)** — agreed terminology for this feature; also surfaced that today's `lg:`-gated components (search's FilterSidebar, MapView's two-column split) currently render their *mobile* stacked layout all the way up to 1024px, meaning tablet-width screens get the mobile treatment, not a bespoke tablet one — accepted as fine, not something this pass needed to fix.

## Problems solved

- The `HotelCard` list-variant clipping bug was not obvious from a document-level overflow check alone (`scrollWidth` never exceeded `clientWidth` because the squished text just wrapped/truncated within its narrow column rather than pushing the page wider) — only caught by actually looking at screenshots, not just running the automated overflow check. Same lesson applies to any future responsive audit: automated width checks catch page-level overflow but miss "technically fits, but unreadably squished" bugs.
- The admin table overflow (`AppShell.tsx` missing `min-w-0`) *was* caught by the automated `scrollWidth` vs `clientWidth` check, and was root-caused to one missing utility class on the shared shell rather than patched per-table — fixing it there resolved both `HotelsListPage` and `BookingsListPage` in one change instead of two.

## Current state

All three fixes plus both context-doc updates are complete, verified, and sitting as **uncommitted changes directly in the main repo's working tree on `main`** (developer's standing preference — not committed by the developer yet this session). Verified via `tsc --noEmit` (frontend, clean), `tsc -b` + `oxlint` (frontend-admin, clean — same 3 pre-existing shadcn-file warnings, none new), `eslint` (clean on both changed frontend files), and multiple real Playwright headless-browser passes per fix (before-fix confirming each bug, after-fix confirming the resolution) across: `frontend/` home, search (grid/list/map views), hotel details, favorites, compare (tray + table), login, bookings; `frontend-admin` dashboard, hotels list, bookings list, hotel form (+ Room Types tab, accordion expanded), booking detail (logged in as the real seeded admin, `admin@stayzy.dev`).

`RateOverrideManager`'s `sm:grid-cols-4` date/price grid shows visually tight (but not overflowing/overlapping) input placeholders at 768px — deliberately left as-is, since it's functional, not broken, and matches this feature's agreed "no overflow/no broken layout" bar rather than a pixel-perfect redesign bar.

Git status right now (main repo, branch `main`, all uncommitted):
```
 M context/progress-tracker.md
 M context/ui-registry.md
 M frontend-admin/src/components/layout/AppShell.tsx
 M frontend/features/compare/components/CompareTray.tsx
 M frontend/features/search/components/HotelCard.tsx
```

All ad hoc verification dev servers were cleanly stopped after use: I started a temporary `frontend/` dev server on :3000 for the audit and killed it afterward; the always-running backend (:4000) and `frontend-admin` (:5173) pair was used read-only (browser navigation + a real admin login) and never modified or stopped.

## Next session starts with

**Feature 31 — Environment Variables** (first item of Phase 9, Deployment; Phase 8 Polish is now fully complete). Read `build-plan.md`'s section for it: all production env vars (`backend`, `frontend`, `frontend-admin`) documented and configured in the hosting provider's dashboard.

First, though: **the developer has not yet run `git commit` on this session's changes** (see git status list above, 5 modified files). Confirm those are committed before starting Feature 31.

## Open questions

- **Leftover "Temp User 1" test data in the dev DB** (bookings against Hotel Marais Charme, dated ~2026-07-13) — flagged repeatedly across Features 26/27/28/29, still not deleted, still awaiting the developer's decision. Directly visible again in this session's admin Bookings screenshots.
- The Feature 16 rating-consistency question — carried over across many sessions, likely mostly moot since Feature 24 keeps `hotels.average_rating`/`review_count` genuinely in sync on every real review write, but can still diverge for any pre-existing hotel whose stored rating was never backed by a real review row. Not yet re-verified.
- Whether to retrofit the fetch-error-state pattern onto `HotelsListPage` and other existing admin lists — not blocking, flagged in `ui-registry.md`.
- Whether to retrofit `frontend/`'s `Input` primitive with the `text-foreground` fix applied to `frontend-admin`'s copy in Feature 25 — currently dormant (no native date input exists in `frontend/` yet), apply the moment one appears.
- Whether `frontend-admin` will ever need real phone-width support (would require building the hamburger/drawer nav explicitly deferred this session) — not planned, but worth remembering this was a deliberate scope cut, not an oversight, if it comes up during Phase 9 deployment/access discussions.
