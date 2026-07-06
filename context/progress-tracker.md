# Progress Tracker

Living document. Updated after every feature is completed. Claude reads this at the start of every session to know exactly where the build is and what comes next. Never start implementing without reading this file first.

---

## How to Use This File

At the start of every session:

- Read this file to understand current state
- Check current phase and next feature
- Read the relevant section of `build-plan.md` before implementing

After completing any feature:

- Mark it as complete with the date
- Update current phase if needed
- Add any decisions made or issues encountered
- Update next up

---

## Current Status

**Phase:** 2 — Homepage + Search Foundation
**Current feature:** 08 Admin Room Type CRUD
**Next up:** 08 Admin Room Type CRUD — read `build-plan.md`'s section for it (room type management nested under `/hotels/[id]`, CRUD endpoints for `room_types`/`room_type_features`/`room_type_images`, rate override management for seasonal pricing/blackout dates).
**Blocking issues:** None. Note: this dev environment's `S3_BUCKET`/`S3_REGION`/`S3_ACCESS_KEY_ID`/`S3_SECRET_ACCESS_KEY` are all still blank in `backend/.env` — image upload code is correct and fails gracefully (clean error, not a crash) but was never exercised against a real bucket. Fill those in to actually test image upload/room-type-image upload.
**Latest completed addition:** 07 Admin Hotel CRUD — 2026-07-06

---

## Build Phases

### Phase 1 — Foundation

- [x] 01 Monorepo scaffold
- [x] 02 Database schema
- [x] 03 User authentication
- [x] 04 Admin authentication

### Phase 2 — Homepage + Search Foundation

- [x] 05 Homepage UI
- [x] 06 Search results UI
- [x] 07 Admin hotel CRUD
- [ ] 08 Admin room type CRUD
- [ ] 09 Search backend wiring
- [ ] 10 Recent searches + search suggestions
- [ ] 11 Trending destinations

### Phase 3 — Hotel Details

- [ ] 12 Hotel details UI
- [ ] 13 Room selection
- [ ] 14 Map integration
- [ ] 15 Similar hotels
- [ ] 16 Reviews display

### Phase 4 — Favorites + Compare

- [ ] 17 Favorites
- [ ] 18 Compare hotels

### Phase 5 — Booking, Checkout, Payment

- [ ] 19 Booking creation
- [ ] 20 Stripe setup
- [ ] 21 Checkout page
- [ ] 22 Stripe webhook
- [ ] 23 My bookings

### Phase 6 — Reviews

- [ ] 24 Review creation

### Phase 7 — Admin Operations

- [ ] 25 Admin booking list
- [ ] 26 Admin booking actions
- [ ] 27 Admin dashboard

### Phase 8 — Polish

- [ ] 28 Skeleton loading
- [ ] 29 Empty states
- [ ] 30 Responsive pass

### Phase 9 — Deployment

- [ ] 31 Environment variables
- [ ] 32 Backend deployment
- [ ] 33 User frontend deployment
- [ ] 34 Admin frontend deployment
- [ ] 35 Production smoke test

### Phase 10 — AI Phase (Future)

Not broken into features yet — planning starts after Phase 9 is complete and stable.

---

## Completed Features

### ✅ 07 Admin Hotel CRUD — completed 2026-07-06
Notes: `frontend-admin/`'s first real authenticated app screens beyond login. New `AppShell`/`Sidebar`/`Topbar` (`components/layout/`) — the shell `ui-rules.md` already specified but nothing had built yet; `Dashboard`/`Bookings` nav items render disabled ("Soon") since those routes don't exist until Features 25–27, only `Hotels` is live. `/hotels` (table: image/name, location, star rating, status badge, row actions), `/hotels/new` and `/hotels/:id` (shared `HotelFormPage` — all hotel fields, an `AmenitiesPicker` over the existing seeded `amenities` table, and — edit mode only — `HotelImagesManager`: upload, native-HTML5 drag-to-reorder, mark-one-main, delete). Backend: `routes/queries/services/controllers` for hotel CRUD + amenities list, following the existing layered-architecture convention exactly (first feature to actually populate `models/`/`queries/`/`services/`/`controllers/admin/`, previously empty folders). Soft delete via a new nullable `hotels.deleted_at` column (migration `0010`) — independent of the existing `status` (draft/published) column, not a third status value; every list/lookup query filters `deleted_at IS NULL`. Server-side geocoding behind a small `GeocodingProvider` interface (`services/geocoding/`) with Mapbox as the only implementation today (reuses `MAPBOX_ACCESS_TOKEN`, already scaffolded for Feature 06's map) — swapping providers later is one new file, not a rewrite; only re-geocodes on update when address fields actually changed. Images upload through the backend (`multer` memory storage → `@aws-sdk/client-s3`), not presigned direct-to-S3 — one request, fits the existing layered pattern. Any authenticated admin can delete (no role-gating introduced — `requireAdmin` doesn't check `admin_user.role` anywhere yet and this wasn't the feature to add that). Fixed a real bug found during verification: `config/s3.ts` constructed the `S3Client` eagerly at import time, which crashes the *entire backend* on startup in any environment where S3 isn't configured yet (this dev environment's S3 env vars are all blank) — made lazy (constructed on first actual upload/delete call) instead. Also fixed a live pre-existing bug in `frontend-admin`'s Feature 04 `LoginForm.tsx` (`text-state-error` — same silently-resolves-to-nothing class of bug as Feature 06's fix, just never caught in this app before) and extended the "Booking Status Badge" pattern in `ui-registry.md` to a new "Hotel Status Badge" (draft → neutral, published → success). Verified end-to-end with a real headless-browser pass (Playwright, no project-specific run skill existed yet — none created since nothing beyond the standard two-dev-server pattern was needed): login → hotels list (seeded demo hotels render correctly) → Add Hotel → create (real Mapbox geocoding call succeeds) → redirect to edit page → back to list → new row appears → delete via row menu + confirm dialog → row disappears, confirmed soft-deleted (`deleted_at` set, not hard-deleted) directly in Postgres. Image upload itself could not be exercised live — this environment's `S3_BUCKET`/`S3_REGION`/keys are blank — but the failure mode was confirmed clean (a descriptive 500, not a crash). Caught and fixed a real regression during design-system alignment: dropped `variant="ghost"` on two icon buttons while matching the pre-approved Ghost Button pattern, which silently fell back to the solid-fill default variant — re-verified visually after the fix. `tsc --noEmit` clean and `vite build` clean for both apps.

### ✅ 06 Search Results UI — completed 2026-07-06
Notes: `/search` page (`app/search/page.tsx`, a thin Server Component `<Suspense>` wrapper around the Client Component `features/search/components/SearchPageContent.tsx`). Sticky filter sidebar (price/star/guest-rating/amenities/room-features/meals/free-cancellation/landmarks — all real, client-side, wired through `useSearchState`/`useSearchResults` over a new 27-hotel mock dataset in `features/search/data/mock-hotels.ts`), removable active-filter chips, sort dropdown, List/Grid/Map view toggle (Map view is a real `react-map-gl`/`mapbox-gl` map with pin↔card sync), hotel cards (grid and list variants), pagination, and a genuine empty state (reachable through real filter combinations, not a hardcoded toggle). All state — destination, dates, guests, every filter, sort, view, and page — lives in the URL via `features/search/hooks/useSearchState.ts`, so Feature 09 can swap "filter the mock array" for "call the real backend" without changing how state is read/written. Added `react-map-gl` + `mapbox-gl` and generated shadcn's `checkbox`/`slider` primitives as new dependencies. Homepage's `HeroSearchWidget` now navigates to `/search` with its state serialized into the URL, closing the dead-button gap left by Feature 05. Found and fixed a second systemic token-doc bug (`state-error` etc. vs the actually-registered `error` etc. — see Architecture Decisions) and retrofitted 6 already-shipped files that had it. Fixed a mobile responsive bug found during verification: the filter sidebar and Map view's two-column layout both overflowed horizontally below `lg:` — both now stack vertically on mobile/tablet. Verified end-to-end with Playwright: all filters/sort/pagination/empty-state/view-toggle behavior confirmed via real URL state changes, Map view confirmed rendering real Mapbox tiles with all 27 pins and working pan/select sync, homepage→search navigation confirmed carrying destination/dates/guests, responsive at mobile/tablet/desktop with no horizontal overflow. `tsc --noEmit`, `eslint`, and `next build` all clean.

### ✅ 05 Homepage UI — completed 2026-07-05
Notes: `frontend/`'s homepage (`app/page.tsx`) plus the shared page shell it depends on. `components/layout/Navbar.tsx` is a Server Component that calls the new `lib/get-server-session.ts` (forwards the incoming request's `cookie` header directly to the backend's `get-session`, since Server Components can't use the browser-only rewrite proxy from Feature 03) and renders either a Log-in button or `components/layout/AccountMenu.tsx` (Client Component, Popover-based dropdown — My Bookings/Profile/Logout). `components/layout/Footer.tsx` (homepage-only, per `ui-rules.md`) has placeholder Company/Support/Legal links. The hero search widget (`features/search/components/{HeroSearchWidget,DestinationInput,DateRangePicker,GuestsRoomsPicker}.tsx`) is interactive (destination text, a date-range Popover+Calendar, and an Adults/Kids/Rooms stepper Popover) but holds local state only — no API calls, no navigation, since `/search` doesn't exist until Feature 06. `features/trending-destinations/components/TrendingDestinations.tsx` has 8 hardcoded destinations (its own new feature folder, matching Feature 11's numbered slot, so that feature can add a data hook here later without restructuring). Added `react-day-picker` (+ its `date-fns` peer) as a new approved `frontend/` dependency for shadcn's `Calendar` primitive — see Architecture Decisions. Verified in a real headless browser (Playwright, since no project-specific run skill existed yet for this app — none was created since nothing app-specific beyond the standard Next.js dev-server pattern was needed) at mobile/tablet/desktop widths, plus both the date-range and guests popovers, plus the logged-in `AccountMenu` state using a throwaway signup (deleted after). Both `tsc --noEmit` and `next build` are clean.

### ✅ 04 Admin Authentication — completed 2026-07-05
Notes: Second, fully independent better-auth instance (`backend/src/config/auth-admin.ts`) with its own `admin_user`/`admin_session`/`admin_account`/`admin_verification` tables (`migrations/0009_create_admin_auth_tables.sql`), email/password only, no social providers, no sign-up route ever mounted. Mounted at `/api/admin/auth/*` (before `express.json()`, same reasoning as the user instance). `requireAdmin` middleware (`backend/src/middlewares/requireAdmin.ts`) mirrors `requireAuth` exactly, checking the admin instance's session. `backend/src/config/seed-admin.ts` (`pnpm seed:admin`) creates the one initial admin account via `authAdmin.api.signUpEmail` server-side (never a raw SQL insert, so the password hash always matches better-auth's own hasher), reading credentials from `ADMIN_SEED_EMAIL`/`ADMIN_SEED_PASSWORD`, skipping safely if that email already exists. `frontend-admin/` has no better-auth client SDK — `features/auth/authApi.ts` is a plain RTK Query slice calling the admin instance's REST endpoints (`sign-in/email`, `get-session`, `sign-out`) directly, per the approved-dependency list and the "all admin calls go through RTK Query" rule. Local dev uses direct cross-origin calls (CORS + `credentials: "include"`), not a Vite proxy — `backend/src/middlewares/cors.ts` now echoes back whichever of `APP_URL`/`ADMIN_APP_URL` sent the request. `features/auth/components/ProtectedRoute.tsx` is a React Router layout route wrapping `useGetSessionQuery`, redirecting to `/login?returnTo=...` when there's no session. `AuthCard`/`LoginForm` ported verbatim from `frontend/`'s Feature 03 patterns (same tokens, same primitives) minus Google/signup/forgot-password, since admin has none of those. Verified end-to-end against the real local Postgres instance: migration applied, admin seeded and idempotent on re-run, login round-trips a session cookie cross-origin with the correct CORS headers, `get-session` returns `null` when logged out and the full session when logged in, `requireAdmin` correctly 401s with no cookie and passes through with one (tested via a throwaway route, removed after), both frontend and backend `tsc`/`vite build` clean.

### ✅ 03 User Authentication — completed 2026-07-04
Notes: better-auth user instance (`backend/src/config/auth.ts`) with email/password + Google OAuth, mounted at `/api/auth/*` (before `express.json()`, since better-auth parses its own raw body). `frontend/next.config.ts` proxies `/api/auth/:path*` to the backend so the session cookie is same-origin in local dev; `frontend/proxy.ts` (Next 16 renamed `middleware.ts` → `proxy.ts`) gates `/checkout`, `/bookings`, `/profile` on session-cookie presence only. 5 pages built: `/login`, `/signup`, `/verify-email` (single page, two states via `?verified=true`), `/forgot-password`, `/reset-password` (new routes, not in the original page list). Real email delivery via Resend (`backend/src/services/email.service.ts`) for verification + password reset — no console-log placeholder. better-auth's own schema (`user`/`session`/`account`/`verification`) generated via `@better-auth/cli generate` and hand-adapted into `migrations/0007_create_auth_tables.sql`; `migrations/0008_add_user_fk_constraints.sql` retypes the four deferred `user_id` columns from `uuid` to `text` (better-auth ids are text, not uuid) and adds the FK constraints. Verified end-to-end against the real local Postgres instance: signup creates a session immediately, get-session round-trips through the proxy, full password-reset flow (request → DB token → reset → login with new password) completed via curl, Google OAuth URL generation confirmed, `tsc`/`next build` both clean, all 5 pages render 200 in a production build.

### ✅ 02 Database Schema — completed 2026-07-04
Notes: All 13 app-specific tables from `architecture.md` created via 5 grouped migrations (`0002_create_hotels.sql`, `0003_create_room_types.sql`, `0004_create_bookings_reviews.sql`, `0005_create_favorites_recent_searches.sql`, `0006_hotels_location_gist_index.sql`), run through the existing `pnpm migrate` runner from Feature 01. better-auth's own tables (`user`/`session`/`account`/`verification`, `admin_user`/`admin_session`) are intentionally **not** created here — they arrive with Features 03/04. `backend/src/config/seed.ts` (run via `pnpm seed`) truncates and re-inserts a small demo dataset: 8 amenities, 5 room features, 4 meal plans, 5 hotels across Paris/Tokyo/New York with 2 room types each. Verified end-to-end against a real local Postgres instance: all tables + GiST index exist with correct constraints, `pnpm seed` run twice back-to-back with no errors or duplicates, `EXPLAIN` confirms `hotels_location_gist_idx` is actually used for `ST_DWithin` queries, `pnpm build` typechecks clean.

### ✅ 01 Monorepo scaffold — completed 2026-07-04
Notes: `backend/` (Express + TS), `frontend/` (Next.js 16 App Router), and `frontend-admin/` (Vite + React) all boot independently with `pnpm`. No Docker — `DATABASE_URL` in `backend/.env` points at any reachable Postgres instance. PostGIS enabled via a small custom migration runner (`backend/src/config/migrate.ts`, `pnpm migrate`) rather than an ad hoc script, so Feature 02 can add table migrations to the same mechanism. Full `ui-tokens.md` token block and shadcn/ui are wired into both frontends now, not deferred to Feature 05. Verified end-to-end against a real local Postgres instance: migration applied, `postgis` shows installed via `\dx`, `GET /health` returns 200, both frontends boot and serve 200.

---

## Architecture Decisions

_Decisions made during the build that deviate from or extend the context files get logged here as they happen._

Format when adding:

```
### [Feature] — [date]
Decision: [what was decided]
Reason: [why]
Impact: [what files or components this affects]
```

### 07 Admin Hotel CRUD — 2026-07-06
Decision: Hotel "delete" is a soft delete via a new nullable `hotels.deleted_at` column, not a third `status` value and not a hard row delete.
Reason: `hotels.status` is a `draft`/`published` lifecycle field with its own `CHECK` constraint — deletion is a separate, independent concern (developer-confirmed when the ambiguity came up during planning).
Impact: `migrations/0010_add_hotels_deleted_at.sql`; every hotel query in `queries/hotels.queries.ts` filters `WHERE deleted_at IS NULL`.

### 07 Admin Hotel CRUD — 2026-07-06
Decision: Server-side geocoding goes through a small `GeocodingProvider` interface (`services/geocoding/geocoding.provider.ts` + `mapbox.provider.ts` + an env-driven factory in `index.ts`), not a direct Mapbox SDK call inline in the hotel service.
Reason: Developer asked for geocoding to be swappable to a different provider later without a rewrite.
Impact: `hotel.service.ts` calls `geocodingProvider.geocode(address)` only; adding a second provider means one new file + one line in the factory, not touching call sites. Only re-geocodes on update if address fields actually changed (compared against the existing row).

### 07 Admin Hotel CRUD — 2026-07-06
Decision: Images upload through the backend (`multer` memory storage → `@aws-sdk/client-s3`), not a presigned direct-to-S3 flow from the browser.
Reason: One request, fits the existing `routes → controllers → services` layering exactly; a low-traffic admin panel doesn't need to offload upload bandwidth from the backend.
Impact: New `multer` dependency (backend only). `POST /admin/hotels/:id/images` is multipart; `PATCH .../images` (reorder/mark-main) and everything else stays JSON.

### 07 Admin Hotel CRUD — 2026-07-06 (bug found during verification)
Decision: `config/s3.ts` now constructs the `S3Client` lazily (`getS3Client()`, built on first call) instead of eagerly at module import time.
Reason: `S3Client`'s constructor validates the AWS region synchronously and throws if it's missing — with this dev environment's `S3_REGION` blank, the eager version crashed the *entire backend* on startup (not just image upload), the moment anything imported the module. Caught live: `tsx watch` kept crash-looping until fixed.
Impact: `config/s3.ts`, `services/upload.service.ts`. Any environment without S3 configured now runs fine; only an actual upload/delete call fails, with a clean descriptive error (`services/upload.service.ts`'s `getBucket()` guard), not a process crash.

### 07 Admin Hotel CRUD — 2026-07-06
Decision: No role-gating added for hotel delete (or anything else) — any authenticated admin can do it.
Reason: `requireAdmin` has never checked `admin_user.role` (`admin`/`super_admin`) anywhere in the codebase; developer confirmed this isn't the feature to introduce that machinery.
Impact: `middlewares/requireAdmin.ts` unchanged. Revisit if a future feature actually needs role-based permissions.

### 07 Admin Hotel CRUD — 2026-07-06 (post-`/review` fixes)
Decision: Fixed two developer-reported issues after the feature was marked complete: (1) the admin sidebar scrolled away with the page on any content taller than the viewport (the hotel edit form + Photos section) — `Sidebar.tsx`'s `h-screen` set its height but never pinned it, since the `AppShell` wrapper has no height constraint of its own; added `sticky top-0`. (2) Editing a hotel and clicking Save without touching the check-in/check-out time pickers failed with `"Expected time in HH:MM format"` — root cause was in the backend, not the form: `hotels.queries.ts` selected `check_in_time`/`check_out_time` raw, and `pg` serializes Postgres `time` columns as `"HH:MM:SS"`, which `HotelFormPage.tsx` prefills verbatim into form state; submitting without ever triggering the time input's `onChange` (which normalizes to HH:MM) sent the stale `HH:MM:SS` string straight into the strict `HH:MM` zod regex. Fixed at the query layer (`to_char(check_in_time, 'HH24:MI')`) rather than loosening the regex or patching the frontend, so every consumer of this API gets a consistently-shaped value.
Reason: Both verified against the running app before fixing — reproduced the exact reported behavior first, then confirmed the fix with a fresh Playwright pass (prefilled time values now read back as `"14:00"`, update succeeds untouched, sidebar's bounding box stays at the same `y` position after a page scroll of 800px).
Impact: `frontend-admin/src/components/layout/Sidebar.tsx`, `backend/src/queries/hotels.queries.ts`.

### 06 Search Results UI — 2026-07-06 (post-`/review` fixes)
Decision: Fixed three developer-reported issues after the feature was marked complete: (1) `HotelCard`'s grid variant wrapper wasn't a flex container, so the price/CTA row couldn't be pinned to a shared bottom edge across cards of different heights in the same grid row — made the wrapper always `flex` (`flex-col`/`flex-row` per variant). (2) The discount badge used `bg-error-dim` (10%-opacity) directly over a photo, nearly invisible on some images — switched to solid `bg-error` + `text-white`, matching how a badge needs more opacity when it sits on an image instead of the flat page background. (3) The price range slider fired `onChange` (→ URL write → full re-filter) on every drag tick, causing jank — refactored into a `PriceRangeSlider` subcomponent using local state for the live thumb position plus the `Slider` primitive's `onValueCommitted` (fires once, on release) for the actual state/URL commit.
Reason: All three were verified against the running app before fixing (not assumed from the report alone). For (3), the initial fix attempt used a `useEffect` to re-sync local state from the URL — `eslint-plugin-react-hooks`'s `set-state-in-effect` rule correctly flagged this as the "adjusting state on a prop change via effect" anti-pattern; switched to React's recommended fix instead (remount via `key` when the external value changes), which needed no effect at all.
Impact: `frontend/features/search/components/{HotelCard,FilterSidebar}.tsx`, `context/ui-registry.md` (both entries corrected). Any future badge placed on top of a photo (not the flat page background) should default to a solid color + `text-white`, not the `-dim` token pairing. Any future continuous-drag input (sliders, etc.) that triggers an expensive side effect should use the same local-state-plus-commit-event pattern rather than firing on every tick.

### 06 Search Results UI — 2026-07-05 (pre-implementation fix)
Decision: Fixed a second systemic token-doc bug: `ui-tokens.md`/`ui-rules.md`/`ui-registry.md` documented status colors as `state-success`/`state-error`/`state-warning`/`state-info`/`state-neutral` (and `-dim` variants), but `app/globals.css`'s `@theme inline` block only ever registered `--color-success`, `--color-error`, `--color-warning`, `--color-info`, `--color-neutral` — no `--color-state-*` key exists. Corrected all three docs to the bare form (`success`, `error-dim`, ...).
Reason: Same class of bug as Feature 03's `border-default` vs `border-border-default` fix — verified by building the app and grepping the compiled CSS: `.text-state-error` produced zero output while `.text-info` (this feature's `GuestRatingBadge`) compiled correctly. Confirmed with the developer before fixing, since it touches files outside this feature's scope.
Impact: `context/ui-tokens.md`, `context/ui-rules.md`, `context/ui-registry.md` (docs corrected). Retrofitted 6 already-shipped files that had the broken classes and were silently rendering with no error/success/destructive color at all: `frontend/features/auth/components/{ForgotPasswordForm,LoginForm,VerifyEmailStatus,ResetPasswordForm,SignupForm}.tsx` and `frontend/components/layout/AccountMenu.tsx` (Logout item). Any future status-color usage (booking badges in Features 21–27) must use the bare form, never `state-`-prefixed.

### 06 Search Results UI — 2026-07-06
Decision: All `/search` state (destination, dates, guests, every sidebar filter, sort, view, page) lives in the URL query string via `features/search/hooks/useSearchState.ts`, read with `useSearchParams`/written with `router.replace(..., { scroll: false })` — not local React state.
Reason: `/search` is a real, shareable, bookmarkable URL, and `architecture.md`'s `GET /search` already expects exactly this param shape (`sort`, filters, pagination). Building it URL-driven now means Feature 09 mostly swaps "filter the mock array from parsed URL state" for "send the same params to the backend" rather than re-deriving state management from scratch. Confirmed with the developer during `/architect`.
Impact: `frontend/features/search/hooks/useSearchState.ts` (parse/serialize helpers + the hook), every Feature 06 component takes `state`/`onChange` rather than owning its own state. Changing any filter/sort/destination/date/guest field resets `page` back to 1; changing only `view` or `page` does not.

### 06 Search Results UI — 2026-07-06
Decision: Added `react-map-gl` + `mapbox-gl` as new `frontend/` dependencies for Map view, and generated shadcn's `checkbox`/`slider` primitives (`components/ui/{checkbox,slider}.tsx`, unmodified from generated output).
Reason: `react-map-gl` is the standard declarative React wrapper around `mapbox-gl` — avoids hand-rolling ref lifecycle/cleanup for the map instance. Checkbox/Slider are shadcn primitives the filter sidebar needed that didn't exist yet in `components/ui/`, same "generate via shadcn CLI, don't hand-roll" precedent as `calendar`/`popover` in Feature 05. Confirmed with the developer during `/architect` ("clean and neat approach... without adding complex code").
Impact: `frontend/package.json`, `code-standards.md`'s approved-dependency list, `components/ui/{checkbox,slider}.tsx`, `features/search/components/MapView.tsx`.

### 06 Search Results UI — 2026-07-06
Decision: Mock hotel data (`features/search/data/mock-hotels.ts`, 27 hotels across 5 cities) is shaped to match `architecture.md`'s future `GET /search` response exactly (price, rating, location + lat/lng, amenities, room type, etc.), and filter option lists (amenities/room features/meal plans/landmarks) are derived from that array at module load (`Array.from(new Set(...))`) rather than hand-maintained separately.
Reason: Keeps the mock data as a drop-in stand-in for Feature 09's real backend response (card/page components won't need restructuring, just a different data source), and makes the filter sidebar's option lists impossible to drift out of sync with the data actually being filtered.
Impact: `frontend/features/search/data/mock-hotels.ts`, `FilterSidebar.tsx`. Feature 09 should replace the array + its derived-constant exports, not the components that consume them.

### 06 Search Results UI — 2026-07-06 (post-verification fix)
Decision: Filter sidebar and Map view's two-column layout both switched from an always-on fixed-width/grid layout to stacking vertically below the `lg:` breakpoint (sidebar: `w-full` → `lg:w-72`; Map view: `flex flex-col` → `lg:grid lg:grid-cols-[1fr_28rem]`). The results-count/sort/view-toggle toolbar row also gained `flex-wrap`.
Reason: Caught via real Playwright verification at a 390px mobile viewport — the fixed-width sidebar (288px) and Map view's fixed 28rem (448px) second column both caused horizontal page overflow, and the toolbar's `justify-between` squeezed the result-count text into an awkward 3-line wrap. None of this was caught by `tsc`/`eslint`/`next build`, only by actually rendering the page.
Impact: `frontend/features/search/components/{FilterSidebar,MapView,SearchPageContent}.tsx`. Worth remembering for Feature 30's dedicated responsive pass: any new fixed-width side-by-side layout on `/search`-like pages needs an explicit mobile stacking variant from the start, not just at the final audit.

### 05 Homepage UI — 2026-07-05 (post-review refinement)
Decision: The Destination segment of the hero search widget gets its own permanent bordered box (`border border-border-default bg-subtle`, focus-within switches to `border-accent-border` + a matching ring) — unlike the Date/Guests segments, which stay borderless at rest and rely on the Popover itself as the interaction cue.
Reason: Two rounds of `/review` feedback on this same field. First pass: it had no hover/focus feedback at all (an oversight, fixed with a hover/focus-within background). Second pass: that fix only changed the *interaction* state, not the *resting* appearance — the actual complaint was that a plain-text field with no border doesn't read as an input until touched. Developer explicitly chose "visible bordered box" over the alternatives when asked.
Impact: `frontend/features/search/components/DestinationInput.tsx`, `ui-registry.md`. Real gotcha hit while wiring the focus state: an initial `hover:border-border-subtle` was left in alongside `focus-within:border-accent-border` — since a real cursor sits over the field while typing, `:hover` and `:focus-within` are both true simultaneously, and Tailwind's generated stylesheet order (not the `className` string's source order) decided which one won, silently killing the accent focus color. Removed the redundant hover-border rule (the box is already visible at rest, so hover didn't need to touch border-color at all). Worth remembering for any future element where hover and focus-within touch the same CSS property — verify with computed styles, not just a screenshot, since a screenshot taken via a real mouse click will have both pseudo-classes active at once.
Follow-up decision (same session): extended the same bordered-box treatment to the Date and Guests segments too (`DateRangePicker.tsx`, `GuestsRoomsPicker.tsx`), for visual consistency across all three — developer asked for this directly after the Destination-only fix looked inconsistent. Since those two are `PopoverTrigger`s (not a `div` wrapping a native input), used `focus-visible:` + `aria-expanded:` instead of `focus-within:` — base-ui sets `aria-expanded="true"` on a trigger for the entire time its popover stays open, so the box stays highlighted throughout, not just for the instant it receives focus. Also dropped the search widget row's `divide-x`/`divide-y` dividers (`HeroSearchWidget.tsx`), since each segment now draws its own border and a divider line next to it would double up.

### 05 Homepage UI — 2026-07-05
Decision: Added `react-day-picker` + `date-fns` as new approved `frontend/` dependencies, generating shadcn's standard `Calendar` primitive rather than hand-rolling date-range math.
Reason: `code-standards.md` already says to prefer shadcn/ui primitives over custom-built components; the date-range picker is real date-math logic (range selection, disabled past dates, month navigation), not decorative UI, and this is exactly the kind of "clever/custom" work worth avoiding when a standard primitive exists. Confirmed with the developer before adding (see the `/architect` session this same day).
Impact: `frontend/package.json`, `code-standards.md`'s approved-dependency list, `components/ui/calendar.tsx` and `components/ui/popover.tsx` (both newly generated, unmodified from shadcn's output since the project's semantic token remapping from Feature 01 already makes them render on-brand with no manual class edits).

### 05 Homepage UI — 2026-07-05
Decision: `Navbar` is a Server Component that fetches session state itself (`lib/get-server-session.ts`, forwarding the request's `cookie` header directly to the backend's `get-session`), rather than a Client Component using `authClient.useSession()`.
Reason: `code-standards.md` prefers Server Components fetching data and passing it down over client-side fetches, and this avoids a loading-state flash on every page load. Only the account dropdown itself (`AccountMenu`) needs to be a Client Component, for its own open/close interactivity and the sign-out click handler.
Impact: `frontend/lib/get-server-session.ts`, `components/layout/Navbar.tsx`, `components/layout/AccountMenu.tsx`. Unlike `frontend-admin/`'s `ProtectedRoute` (which has to be client-side, since Vite has no server-rendering layer), any future `frontend/` page needing session state server-side should reuse `get-server-session.ts` rather than inventing another fetch.

### 05 Homepage UI — 2026-07-05
Decision: Navbar scope for this feature is strictly "logo + login/account state," per `build-plan.md`'s Feature 05 bullet list — no Favorites icon, Compare icon, or compact nav search bar yet, even though `project-overview.md` describes the fuller end-state Navbar.
Reason: Those elements need functionality that doesn't exist until Features 17/18 (Favorites/Compare) — adding inert icons now would be premature UI for features that aren't built, and scope for each feature build is `build-plan.md`'s bullet list, not `project-overview.md`'s end-state description.
Impact: `components/layout/Navbar.tsx`. Features 17/18 will need to add those nav icons, and will also need to decide how the compact nav search bar (mentioned in `project-overview.md`, not yet built) hides itself specifically on the homepage route.

### 04 Admin Authentication — 2026-07-05
Decision: Admin auth uses direct cross-origin calls (CORS + `credentials: "include"`) instead of a Vite dev-server proxy, even though `library-docs.md` originally suggested Feature 04 would need the same rewrite trick as Feature 03.
Reason: `frontend-admin/src/lib/apiBaseQuery.ts` already had `credentials: "include"` and `backend/src/middlewares/cors.ts` already had `Access-Control-Allow-Credentials: true` from Feature 01's scaffold — both only make sense for direct cross-origin calls, not a proxy (a proxied same-origin request wouldn't need either). `localhost:5173`/`localhost:4000` are same-site (same registrable domain, different port), so no `SameSite` issues arise.
Impact: `backend/src/middlewares/cors.ts` (now checks the request `Origin` against `[APP_URL, ADMIN_APP_URL]` and echoes back whichever matches, instead of a single hardcoded origin), new `ADMIN_APP_URL`/`API_URL` env vars, `auth-admin.ts`'s `baseURL`/`trustedOrigins` point at the backend's own address and the admin frontend's real origin (not a proxy path). `library-docs.md`'s stale rewrite-proxy guidance for the admin instance was corrected.

### 04 Admin Authentication — 2026-07-05
Decision: `auth-admin.ts` sets `advanced.cookiePrefix: "admin"`.
Reason: better-auth's default cookie name is `better-auth.session_token` regardless of instance — since both instances are mounted on the same backend host, they would silently overwrite each other's session cookie (same name, same domain, same `Path=/`) without a distinct prefix. Found and fixed during end-to-end verification, confirmed by logging into both instances in the same cookie jar before and after the fix.
Impact: `backend/src/config/auth-admin.ts`. Any further better-auth instances added to this backend must set their own distinct `cookiePrefix` too.

### 04 Admin Authentication — 2026-07-05
Decision: `frontend-admin/` has no better-auth client library; `features/auth/authApi.ts` is a plain RTK Query slice calling the admin instance's REST endpoints directly (`/api/admin/auth/sign-in/email`, `/get-session`, `/sign-out`).
Reason: `code-standards.md`'s approved-dependency list for `frontend-admin/` never included better-auth, and `architecture.md` mandates all admin API calls go through RTK Query with no ad hoc fetch calls. better-auth's REST endpoints are stable and documented, so no client SDK is needed to call them.
Impact: `frontend-admin/src/features/auth/authApi.ts`, `app/store.ts`. `get-session` returns `null` (HTTP 200) when logged out, not a 4xx — `ProtectedRoute.tsx` checks `data`, not `error`, for that reason.

### 04 Admin Authentication — 2026-07-05
Decision: The initial admin account is created by `backend/src/config/seed-admin.ts` calling `authAdmin.api.signUpEmail(...)` server-side directly, from `ADMIN_SEED_EMAIL`/`ADMIN_SEED_PASSWORD` env vars, skipping if that email already exists — never a raw SQL insert.
Reason: Guarantees the password hash always matches exactly what better-auth's own hasher produces, with no risk of a hand-rolled hash silently mismatching at login time.
Impact: `backend/src/config/seed-admin.ts`, new `pnpm seed:admin` script, `ADMIN_SEED_EMAIL`/`ADMIN_SEED_PASSWORD` in `.env`/`.env.example`.

### 03 User Authentication — 2026-07-04
Decision: Local dev uses a Next.js `rewrites()` proxy (`/api/auth/:path*` → backend) instead of direct cross-origin `fetch` calls from `frontend/` to `backend/`.
Reason: `localhost:3000`/`localhost:4000` have no shared top-level domain the way production subdomains will. Proxying makes the browser see everything as same-origin, sidestepping `SameSite`/CORS cookie edge cases entirely and mirroring the production topology instead of relying on nuanced cross-port-but-same-site browser behavior.
Impact: `frontend/next.config.ts`, `frontend/lib/auth-client.ts` (no `baseURL`, defaults to same-origin `/api/auth`). Any future browser-facing backend route needs the same rewrite treatment locally.

### 03 User Authentication — 2026-07-04
Decision: `frontend/middleware.ts` was written then immediately renamed to `frontend/proxy.ts` (function renamed `middleware` → `proxy`).
Reason: this Next.js version (16.2.10) deprecated the `middleware` file convention in favor of `proxy` — see `frontend/AGENTS.md`'s warning that this isn't the Next.js most training data reflects. Caught only after the dev server logged a deprecation warning; `node_modules/next/dist/docs/` should be checked before writing Next.js-version-sensitive code, not after.
Impact: `frontend/proxy.ts`. Worth remembering for any future feature touching Next.js file conventions in this repo.

### 03 User Authentication — 2026-07-04
Decision: `library-docs.md`'s original better-auth snippet (`requireEmailVerification: true`) was wrong and has been corrected to `false`.
Reason: better-auth's actual behavior — verified by reading its source — is that `requireEmailVerification: true` prevents sign-up from creating a session at all (and blocks sign-in for unverified users), which contradicts the agreed design ("unverified accounts can browse but not book," confirmed with the developer before implementation). `false` + `emailVerification.sendOnSignUp: true` still sends the verification email on sign-up without gating login.
Impact: `backend/src/config/auth.ts`, `context/library-docs.md`. Booking creation (Feature 19) is the only place that should ever check `session.user.emailVerified`.

### 03 User Authentication — 2026-07-04
Decision: Real email delivery via Resend from the start, not a console-log placeholder.
Reason: developer preference — see the `/architect` session this same day. `backend/src/services/email.service.ts` constructs the `Resend` client lazily (inside the send function, not at module load) so the module can still be imported — and `@better-auth/cli generate` can still run — before a `RESEND_API_KEY` exists.
Impact: `backend/src/services/email.service.ts`, `backend/src/config/auth.ts`, `RESEND_API_KEY`/`EMAIL_FROM` in `.env`/`.env.example`. `EMAIL_FROM` defaults to Resend's `onboarding@resend.dev` sandbox sender until a verified domain exists.

### 03 User Authentication — 2026-07-04
Decision: `bookings.user_id`, `reviews.user_id`, `favorites.user_id`, `recent_searches.user_id` were retyped from `uuid` to `text` before adding the deferred FK constraints, instead of adding the FKs directly.
Reason: better-auth generates `text` ids (not `uuid`) for the `user` table by default. Postgres FK constraints require matching column types with no implicit cast between `uuid` and `text`, so the FK could not be added without this retype. `architecture.md`'s schema table already flagged this ambiguity (`text/uuid`) rather than assuming — this feature resolves it in favor of `text`, matching better-auth's convention rather than fighting it.
Impact: `backend/migrations/0008_add_user_fk_constraints.sql`. `ON DELETE RESTRICT` on `bookings`/`reviews` (financial/historical records, consistent with the Feature 02 hotel/room_type FK reasoning), `ON DELETE CASCADE` on `favorites`/`recent_searches` (convenience data, not ownership).

### 03 User Authentication — 2026-07-04
Decision: Fixed a systemic bug in the design tokens: `ui-tokens.md`/`ui-rules.md`/`ui-registry.md` documented `border-default`/`border-subtle`/`border-strong` as Tailwind classes, but the actual generated classes are `border-border-default`/`border-border-subtle`/`border-border-strong` (same doubled-prefix pattern already used correctly for `text-text-primary` etc.).
Reason: verified by compiling the real Tailwind output — the short form for `border-default` silently did nothing (rode on a coincidental global shadcn reset that happened to look right), and `border-subtle` silently resolved to the wrong color (collided with the unrelated `bg-subtle` token). Found while building the first real component (`AuthCard`) to use a border color token; no prior feature had exercised it. Confirmed with the developer before fixing.
Impact: `context/ui-tokens.md`, `context/ui-rules.md`, `context/ui-registry.md` (all three corrected), plus every new component in `frontend/features/auth/components/`. Any component built before this fix that used the short form should be checked, but none existed yet.

### 02 Database Schema — 2026-07-04
Decision: `bookings.user_id`, `reviews.user_id`, `favorites.user_id`, `recent_searches.user_id` are plain `uuid` columns with no `REFERENCES` clause.
Reason: The `user` table doesn't exist until Feature 03 (better-auth generates it). Adding the column now without a FK, and the FK constraint via `ALTER TABLE` once `user` exists, avoids inventing a placeholder auth table that risks drifting from what better-auth actually generates.
Impact: Feature 03 must add `ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY (user_id) REFERENCES "user"(id)` for all four tables as part of its own migration, once the better-auth schema is in place.

### 02 Database Schema — 2026-07-04
Decision: `ON DELETE RESTRICT` on `bookings`/`reviews`' FKs to `hotels`/`room_types` (and `reviews.booking_id` → `bookings`); `ON DELETE CASCADE` on all structurally-owned child tables (`hotel_images`, `room_type_images`, join tables, `rate_overrides`, `room_types` under `hotels`, `favorites`/`recent_searches.hotel_id`); `ON DELETE SET NULL` on `room_types.meal_plan_id` (a lookup reference, not ownership).
Reason: Bookings/reviews are financial/historical records that must never silently disappear via cascade — a hotel or room type with any booking/review history can't be hard-deleted. Everything else has no meaning without its parent.
Impact: Feature 07 (Admin Hotel CRUD) needs a soft-delete/archive path for hotels with existing bookings, since hard delete will be blocked by the `RESTRICT` constraint. `hotels.status` (`draft`/`published`) is a natural place to add an `archived` value later.

### 02 Database Schema — 2026-07-04
Decision: All `id` columns use `uuid PRIMARY KEY DEFAULT gen_random_uuid()` — no `uuid-ossp`/`pgcrypto` extension.
Reason: `gen_random_uuid()` has been built into Postgres core since v13; adding an extension for it would be redundant.
Impact: None beyond the migrations themselves — no app-side ID generation code needed.

### 02 Database Schema — 2026-07-04
Decision: `hotels.status`/`bookings.status` are `text` columns with a `CHECK (... IN (...))` constraint rather than native Postgres `ENUM` types or unconstrained `text`.
Reason: Keeps columns readable in query output/debugging with no `ALTER TYPE` ceremony to add a new status later, while still rejecting bad data at the DB layer.
Impact: `backend/migrations/0002_create_hotels.sql`, `0004_create_bookings_reviews.sql`.

### 02 Database Schema — 2026-07-04
Decision: `backend/src/config/seed.ts`'s `insertLookupTable` helper takes an explicit `LookupRow { name: string; icon?: string }` interface rather than `Record<string, string>`.
Reason: `noUncheckedIndexedAccess` (mandated by `code-standards.md`) makes any property access through an index-signature type like `Record<string, string>` come back as `string | undefined`, even for keys known to exist — `tsc` rejected `row.name` being passed where a `string` was required. An explicit interface with named fields sidesteps this entirely.
Impact: `backend/src/config/seed.ts`. Worth remembering for any future generic "iterate arbitrary key/value rows" code in this codebase — prefer named interfaces over `Record<string, T>` when `strict`/`noUncheckedIndexedAccess` is on and a field is guaranteed to exist.

### 01 Monorepo Scaffold — 2026-07-04
Decision: `backend/tsconfig.json` uses `module: "CommonJS"` / `moduleResolution: "Node"` instead of `NodeNext`, and `package.json` has no `"type": "module"`.
Reason: `NodeNext` requires explicit `.js` extensions on every relative import, which contradicts every extensionless import example in `code-standards.md` and `library-docs.md`. CommonJS avoids that friction with zero behavior difference for this backend.
Impact: `backend/src/**` imports never use file extensions, matching the docs exactly.

### 01 Monorepo Scaffold — 2026-07-04
Decision: `shadcn@latest init` (both frontends) pulls in its own default color palette, dark-mode `.dark` block, and a Geist font — all removed/remapped by hand: `.dark` block deleted, `@custom-variant dark` deleted, Geist font import removed, and shadcn's semantic tokens (`background`, `foreground`, `card`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`, `chart-*`, `sidebar-*`) remapped onto the Stayzy palette from `ui-tokens.md` instead of shadcn's own oklch defaults.
Reason: `ui-rules.md` forbids dark mode and mandates the token classes; leaving shadcn's defaults in place would make any shadcn primitive (e.g. `Button`) render off-brand and in a color system components don't otherwise use.
Impact: `frontend/app/globals.css`, `frontend-admin/src/index.css`. shadcn's own `--radius-*` scale was left intact (not reverted to plain Tailwind radius) because `components/ui/button.tsx` depends on `--radius-md` directly — removing it breaks the generated primitive. Net effect is a ~12.5% radius delta on `rounded-2xl`/etc. versus vanilla Tailwind; revisit if it's ever visually significant.

### 01 Monorepo Scaffold — 2026-07-04
Decision: added `react-redux` as a `frontend-admin/` dependency, on top of the approved `@reduxjs/toolkit`.
Reason: `@reduxjs/toolkit` has no React bindings of its own (`Provider`, `useSelector`, `useDispatch`) — `react-redux` is the required peer to use the store from components at all, not an unrelated addition.
Impact: `code-standards.md`'s approved-dependency list for `frontend-admin/` should be updated to include it.

### 01 Monorepo Scaffold — 2026-07-04
Decision: added `"strict": true` (and `noUncheckedIndexedAccess`) to `frontend-admin/tsconfig.app.json` and `tsconfig.node.json`; neither was present in the generated Vite template.
Reason: `code-standards.md` mandates strict mode in every `tsconfig.json`, no exceptions.
Impact: `frontend-admin/tsconfig.app.json`, `frontend-admin/tsconfig.node.json`.

---

## Known Issues

_Issues discovered during the build that are not yet resolved._

Format when adding:

```
### [Issue title]
Feature: [which feature this affects]
Description: [what the issue is]
Status: [open / in progress / resolved]
```

### S3 credentials blank in this dev environment
Feature: 07 Admin Hotel CRUD (also affects Feature 08's room type images)
Description: `backend/.env`'s `S3_BUCKET`/`S3_REGION`/`S3_ACCESS_KEY_ID`/`S3_SECRET_ACCESS_KEY` are all empty. Image upload code is correct and fails cleanly (a descriptive 500, not a crash — see the `07 Admin Hotel CRUD` lazy-`S3Client` architecture decision), but was never exercised against a real bucket end-to-end.
Status: open — fill in real credentials to actually test upload/reorder/delete against S3.

---

## Session Notes

_Brief notes from each session. Useful for picking up context after a break._

Format when adding:

```
### Session — [date]
Built: [what was completed]
Left off: [exactly where the session ended]
Next session starts with: [first thing to do next time]
```

### Session — 2026-07-06 (2)
Built: Feature 07 Admin Hotel CRUD, in full — see Completed Features and Architecture Decisions above (the `AppShell`/`Sidebar`/`Topbar` build, soft-delete-via-`deleted_at` decision, the `GeocodingProvider` abstraction, backend-proxied image upload, and the lazy-`S3Client` bug fix).
Left off: Verified end-to-end with a real headless-browser pass (Playwright, cached install, no project-specific run skill existed yet for `frontend-admin/`) — login, hotels list (5 seeded demo hotels render correctly with real star ratings/status badges), Add Hotel form, create (a real live Mapbox geocoding call succeeded), redirect to the edit page, back to the list, new row visible, delete via the row dropdown + confirm dialog, row disappears — confirmed soft-deleted (`deleted_at` set, not a hard delete) directly against Postgres afterward. Found and fixed a real bug while starting the backend for verification: `config/s3.ts` built the `S3Client` eagerly at import time, which crashed the whole server on startup given this environment's blank S3 env vars — made lazy instead (see Architecture Decisions). Also found and fixed a live pre-existing bug in `frontend-admin`'s Feature 04 `LoginForm.tsx` (`text-state-error`, same silently-resolves-to-nothing class of bug Feature 06 fixed in `frontend/`, just never caught here). Cross-checked the new components against `ui-registry.md`'s pre-approved patterns (Table Wrapper/Row/Cell, Destructive Button, Star Rating, Booking Status Badge) after realizing I'd built some of them ad hoc instead of matching what was already locked in — fixed the drift, and caught+fixed a real regression along the way (dropped `variant="ghost"` on two icon buttons while aligning classes, which silently fell back to a solid-fill default variant; re-verified visually after fixing). Image upload itself could not be exercised against real S3 — this environment's `S3_BUCKET`/`S3_REGION`/keys are blank (logged as an open Known Issue) — but confirmed the failure mode is clean (descriptive 500, not a crash). `tsc --noEmit` and `vite build`/`tsc -b` both clean for `backend/` and `frontend-admin/`. Both dev servers left running (`backend` :4000, `frontend-admin` :5173).
Next session starts with: Feature 08 Admin Room Type CRUD — read `build-plan.md`'s section for it (room type management nested under `/hotels/[id]`, CRUD endpoints for `room_types`/`room_type_features`/`room_type_images`, rate override management for seasonal pricing/blackout dates). Consider filling in real S3 credentials first if room type image upload needs to be tested live.

### Session — 2026-07-06
Built: Feature 06 Search Results UI, in full — see Completed Features and Architecture Decisions above (URL-driven state, `react-map-gl`/`mapbox-gl` + shadcn `checkbox`/`slider` additions, the mock-data-shaped-like-the-real-API decision, and the mobile-stacking fix).
Left off: Found and fixed a second token-doc bug before starting real implementation (`state-error`/`state-success`/etc. classes silently compiling to nothing — same class of issue as Feature 03's border-token bug), confirmed with the developer before retrofitting the 6 already-shipped files that had it. Verified end-to-end with a fresh Playwright pass against `localhost` (not `127.0.0.1` — Next's dev server only treats `localhost` as an allowed same-origin dev client, and hitting `127.0.0.1` silently breaks the client router/HMR bridge in a way that looks exactly like an app bug; lost real time chasing that before realizing it was the test harness, not the app). Confirmed: sort/filter/pagination all correctly reflected in the URL, empty state reachable via a real narrow price-range filter, Map view renders real Mapbox tiles with all pins and working pan/select sync, homepage→search navigation carries destination/dates/guests, no horizontal overflow at mobile/tablet/desktop after the stacking fix. `tsc --noEmit`, `eslint`, and `next build` all clean. The frontend dev server from a prior session had gone unresponsive (hung, 0% CPU, still `LISTEN`ing but not accepting connections) — killed and restarted it; left the fresh one running on :3000 alongside the already-running backend on :4000.
Next session starts with: Feature 07 Admin Hotel CRUD — read `build-plan.md`'s section for it (`frontend-admin/` `/hotels` list/new/edit pages, amenities picker, image upload/reorder with one marked main; backend CRUD endpoints in `backend/src/routes/admin/hotels.routes.ts`, server-side geocoding into `hotels.location`, images to S3).

### Session — 2026-07-04
Built: Feature 01 Monorepo Scaffold, in full — `backend/`, `frontend/`, `frontend-admin/`, root `.gitignore`/`README.md`. See Architecture Decisions above for the notable deviations (CommonJS backend, shadcn token remapping, `react-redux` addition, strict mode fix in admin tsconfigs).
Left off: All three apps verified booting; PostGIS migration verified end-to-end against a real local Postgres instance, then that scratch database was dropped (developer needs to point `backend/.env`'s `DATABASE_URL` at their own instance and run `pnpm migrate` again before Feature 02). No `.env`/`.env.local` files were left in place — only `.env.example` files.
Next session starts with: Feature 02 Database Schema — read `build-plan.md`'s section for it, then write the table migrations following the same `backend/migrations/000X_*.sql` + `schema_migrations` mechanism introduced in Feature 01.

### Session — 2026-07-04 (2)
Built: Feature 02 Database Schema, in full — 5 grouped migrations covering all 13 app-specific tables + the `hotels.location` GiST index, plus `backend/src/config/seed.ts` (`pnpm seed`) seeding demo amenities/room features/meal plans and 5 hotels across 3 cities. See Architecture Decisions above for the deferred user FKs, the RESTRICT/CASCADE split, `gen_random_uuid()` choice, status-as-text-plus-CHECK, and the `noUncheckedIndexedAccess`-vs-`Record<string,string>` gotcha in the seed script.
Left off: Ran against the developer's real local `backend/.env` `DATABASE_URL` (not a scratch DB this time — it was left seeded, not dropped). All migrations applied, `pnpm seed` run twice back-to-back with no errors, `pnpm build` typechecks clean. Database currently has the Feature 01 + Feature 02 schema plus seed data in place — a developer starting Feature 03 can build against it directly without re-running `pnpm migrate`/`pnpm seed` (though re-running `pnpm seed` is always safe).
Next session starts with: Feature 03 User Authentication — read `build-plan.md`'s section for it, configure better-auth for `frontend/` (email/password + Google OAuth, email verification, password reset), then add the deferred FK constraints on `bookings.user_id`/`reviews.user_id`/`favorites.user_id`/`recent_searches.user_id` once the `user` table exists.

### Session — 2026-07-04 (3)
Built: Feature 03 User Authentication, in full — see Completed Features and Architecture Decisions above for the full breakdown (proxy-based local dev cookie strategy, `middleware.ts` → `proxy.ts` rename, the `requireEmailVerification` fix, real Resend email delivery, the `uuid`→`text` user FK retype, and the border-token doc bug fix).
Left off: Both dev servers running locally (`backend/` on :4000, `frontend/` on :3000) against the developer's real local Postgres instance. Full flow verified via curl end-to-end (signup creates a session immediately, password reset request → DB-extracted token → reset → login with new password, Google OAuth URL generation) since no browser automation tool was available this session. `RESEND_API_KEY` is still empty in `backend/.env` — real verification/reset emails will fail silently (logged, not thrown) until the developer adds one; everything else works without it. Test users created during verification were deleted from the `user` table afterward; the seeded hotel data from Feature 02 is untouched.
Next session starts with: Feature 04 Admin Authentication — read `build-plan.md`'s section for it. `frontend-admin/` is Vite, not Next.js, so the Feature 03 rewrite-proxy trick doesn't carry over as-is; decide its local-dev cross-origin cookie strategy explicitly before building the admin login UI.

### Session — 2026-07-05 (2)
Built: Feature 05 Homepage UI, in full — see Completed Features and Architecture Decisions above (the `react-day-picker` addition, the server-side-session-in-Navbar decision, and the deliberately narrow Navbar scope).
Left off: Verified in a real headless browser via Playwright (no chromium-cli available in this environment; used the cached `npx playwright` install directly) at mobile/tablet/desktop widths — no horizontal overflow, search widget collapses to a stacked layout below `lg`, trending grid degrades to 1 column on mobile. Date-range popover (2-month calendar, today highlighted, past dates disabled) and Guests/Rooms popover (steppers) both confirmed working. Logged-in `AccountMenu` state also verified end-to-end using a throwaway signup account against the already-running local backend (session cookie forwarded server-side correctly, dropdown shows My Bookings/Profile/Logout) — the test user was deleted from the `user` table afterward. Caught and fixed one console warning along the way: base-ui's `Button` needs `nativeButton={false}` whenever it's rendered as a `<Link>` via the `render` prop (used for both the Navbar's Log-in button and would apply to any future button-styled link). Both `tsc --noEmit` and `next build` are clean. Left the frontend dev server running locally on :3000 alongside the already-running backend on :4000.
Next session starts with: Feature 06 Search Results UI — read `build-plan.md`'s section for it (sticky filter sidebar, active filter chips, sort dropdown, List/Grid/Map view toggle, hotel card, pagination, empty state — all against static/mock hotel data for now, real backend wiring is Feature 09).

### Session — 2026-07-05
Built: Feature 04 Admin Authentication, in full — see Completed Features and Architecture Decisions above for the full breakdown (CORS-over-proxy decision, the cookie-prefix collision fix, RTK-Query-only admin auth client, and the seed-via-server-API decision).
Left off: Verified end-to-end against the developer's real local Postgres instance and the already-running local backend dev server: migration `0009` applied, `pnpm seed:admin` created and safely re-skips the seeded account, login/get-session/sign-out round-trip a session cookie cross-origin with correct CORS headers, `requireAdmin` tested directly (401 with no cookie, passes through with one) via a throwaway route that was removed afterward, both instances' session cookies confirmed to coexist without collision after the `cookiePrefix` fix (tested with a throwaway signup user, deleted afterward). Both `backend` and `frontend-admin` `tsc`/build are clean. No browser automation tool was available this session, so the admin login UI itself was verified via `vite build` + curl against the dev server, not visually in a browser — worth a quick visual pass next session if convenient. Noticed (but did not touch) several stray crash-looping `tsx watch` processes from past sessions competing for port 4000; harmless but worth a manual `pkill` if the developer wants to tidy up.
Next session starts with: Feature 05 Homepage UI — read `build-plan.md`'s section for it (Navbar, hero search widget, trending destinations with static placeholder data, footer).
