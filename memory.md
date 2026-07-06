# Memory — Feature 07 Admin Hotel CRUD

Last updated: 2026-07-06

## What was built

**`backend/` — first real population of the layered-architecture folders (`models/`, `queries/`, `services/`, `controllers/admin/`, `routes/admin/`):**
- `migrations/0010_add_hotels_deleted_at.sql` — nullable `deleted_at` on `hotels` (soft delete).
- `services/geocoding/{geocoding.provider.ts,mapbox.provider.ts,index.ts}` — a small `GeocodingProvider` interface with Mapbox as the only implementation, selected via an env-driven factory (`GEOCODING_PROVIDER`, defaults to `mapbox`).
- `config/s3.ts` — lazy `getS3Client()` (constructed on first use, not at import time — see Problems Solved).
- `services/upload.service.ts` — `uploadImage`/`deleteImageByUrl`/`assertValidImage` against `@aws-sdk/client-s3`.
- `queries/{hotels,hotel-images,amenities}.queries.ts`, `services/{hotel,amenity}.service.ts`, `controllers/admin/{hotels,amenities}.controller.ts`, `routes/admin/{hotels,amenities}.routes.ts`, `middlewares/{validateRequest,multerUpload}.ts`, `types/hotel.schemas.ts`, `models/hotel.model.ts`, `utils/{slugify,requireParam}.ts` — full CRUD (`GET/POST/PATCH/DELETE /admin/hotels`, image upload/reorder/delete endpoints, `GET /admin/amenities`), mounted in `routes/index.ts` behind `requireAdmin`.
- Added `multer` + `@types/multer` as new backend dependencies.

**`frontend-admin/` — first authenticated screens beyond login:**
- `components/layout/{AppShell,Sidebar,Topbar}.tsx` — the shell `ui-rules.md` already specified but nothing had built yet. `Sidebar` nav: Hotels is live, Dashboard/Bookings render disabled ("Soon") until Features 25–27.
- `features/hotels/{types.ts,hotelsApi.ts,components/{HotelsListPage,HotelFormPage,AmenitiesPicker,HotelImagesManager}.tsx}`, `features/amenities/{types.ts,amenitiesApi.ts}` — `/hotels` list (table, status badges, row actions, delete-confirm dialog), `/hotels/new` + `/hotels/:id` shared form (all hotel fields, amenities picker, and — edit mode only — image manager with native-HTML5 drag-to-reorder + mark-main + delete).
- `components/common/StarRatingDisplay.tsx` — first real usage of `frontend-admin`'s `components/common/`.
- Added shadcn `table`/`dialog`/`select`/`textarea`/`checkbox`/`dropdown-menu`/`badge`/`sonner` components. (The shadcn CLI wrote them to a literal `@/components/ui/` folder instead of resolving the path alias — had to manually move them into `src/components/ui/` and delete the stray `@` directory; watch for this again if adding more shadcn components later.)
- Routes wired into `router/routes.tsx`: `/hotels`, `/hotels/new`, `/hotels/:id`, all under `ProtectedRoute` (now wrapped in `AppShell`).

**Post-`/review` fixes (same session, after Feature 07 was marked complete):**
- `Sidebar.tsx` now has `sticky top-0` — it scrolled away with the page on any content taller than the viewport (the hotel form + Photos section) since `h-screen` alone only sets height, not position.
- `hotels.queries.ts`'s `HOTEL_COLUMNS` now formats `check_in_time`/`check_out_time` via `to_char(..., 'HH24:MI')` — Postgres returns `time` columns as `"HH:MM:SS"`, which got prefilled straight into the edit form and failed the strict `HH:MM` zod validation on save if the user never touched the time pickers.

## Decisions made

- **Soft delete via a new `deleted_at` column**, not a third `status` value — deletion is independent of the draft/published lifecycle. Every hotel query filters `WHERE deleted_at IS NULL`.
- **Geocoding behind a swappable provider interface** (`GeocodingProvider`) — developer explicitly asked for this to be "a kind of plugin" so a different provider can be swapped in later without touching call sites. Only re-geocodes on update if address fields actually changed.
- **Images upload through the backend** (multer → S3), not presigned direct-to-S3 — simpler, fits the existing layered pattern, adequate for a low-traffic admin panel.
- **No role-gating on delete** (or anything) — `requireAdmin` has never checked `admin_user.role` anywhere; not introducing that machinery for this feature.
- **No new heavy frontend dependencies** — plain controlled forms (no `react-hook-form`), native HTML5 drag events for image reorder (no `dnd-kit`) — matches the rest of the codebase and an explicit developer ask for "clean, simple, no complex code."

## Problems solved

- **`S3Client` eager-construction crash**: `config/s3.ts` originally built the `S3Client` at module-import time. `S3Client`'s constructor validates the AWS region synchronously and throws if missing — since this dev environment's S3 env vars are all blank, this crashed the *entire backend* on startup, not just image upload. Fixed by making it lazy (`getS3Client()`, built on first actual call).
- **Live pre-existing bug found in `frontend-admin`'s Feature 04 `LoginForm.tsx`**: used `text-state-error`, which silently resolves to nothing (only `--color-error` is registered, not `--color-state-error`) — same class of bug Feature 06 fixed in `frontend/`, just never caught in this app. Fixed.
- **Design-system drift caught via self-review**: several components (table, badges, buttons, star rating) were built ad hoc instead of matching `ui-registry.md`'s pre-approved patterns (Table Wrapper/Row/Cell, Destructive Button, Booking Status Badge, Star Rating). Fixed to match exactly; extended the Booking Status Badge family with a new "Hotel Status Badge" (draft→neutral, published→success).
- **Self-inflicted regression while fixing the above**: dropped `variant="ghost"` on two icon buttons while aligning classes to the approved Ghost Button pattern, which silently fell back to the solid-fill default variant. Caught via screenshot during verification, fixed, re-verified.
- **Sidebar/time-format bugs** (see What Was Built → post-review fixes) — both reported by the developer after using the feature, both root-caused and fixed rather than patched superficially.

## Current state

Feature 07 is fully built, reviewed, and both developer-reported bugs are fixed and verified. `tsc --noEmit` clean on both `backend` and `frontend-admin`; `vite build`/`tsc -b` clean; oxlint shows only pre-existing warnings (none new). Verified end-to-end with a real headless-browser (Playwright) pass: login → hotels list → create hotel (real live Mapbox geocoding call succeeds) → redirect to edit page → back to list → new row appears → delete via row menu + confirm dialog → row disappears, confirmed soft-deleted (`deleted_at` set, not hard-deleted) directly in Postgres. Sidebar confirmed to stay pinned to the viewport while scrolling a long form; editing a hotel without touching the time fields confirmed to save successfully.

**Not tested**: image upload/reorder/delete against real S3 — this dev environment's `S3_BUCKET`/`S3_REGION`/`S3_ACCESS_KEY_ID`/`S3_SECRET_ACCESS_KEY` are all blank in `backend/.env`. The code fails cleanly (a descriptive 500, not a crash) when exercised without credentials — confirmed live — but the actual upload path has never succeeded against a real bucket. This is logged as an open Known Issue in `progress-tracker.md`.

Both dev servers were left running during this session (`backend` on :4000 via `tsx watch`, `frontend-admin` on :5173 via `vite`) — may or may not still be up depending on how much time has passed.

`ui-registry.md` and `progress-tracker.md` are both fully updated, including the post-review fixes.

## Next session starts with

Feature 08 Admin Room Type CRUD — read `build-plan.md`'s section for it: room type management nested under `/hotels/[id]` (name, description, max adults/kids, base price, total inventory, free cancellation toggle, meal plan, room features, images), CRUD endpoints for `room_types`/`room_type_features`/`room_type_images`, and rate override management (per-date price/availability override) for seasonal pricing and blackout dates.

Consider filling in real S3 credentials first if room type image upload needs to be tested live (same upload pattern from Feature 07 — `services/upload.service.ts` — should be reusable as-is).

## Open questions

- None blocking Feature 08. The only open item is the untested-against-real-S3 image upload path (see Current State) — not blocking since the failure mode is already confirmed clean, just noting it needs real credentials to fully verify.
