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

**Phase:** 1 — Foundation
**Current feature:** 04 Admin Authentication
**Next up:** 04 Admin Authentication — separate better-auth instance for `frontend-admin/` (email/password only, no public sign-up), seeded initial admin account, admin route guard. `frontend-admin/` is Vite, not Next.js, so it has no `rewrites()` equivalent for Feature 03's same-origin-proxy trick — decide the local-dev cross-origin cookie strategy for it explicitly (Vite dev server proxy, or plain CORS + verifying `SameSite=Lax` actually behaves as expected across `localhost` ports) before building the admin auth UI.
**Blocking issues:** None
**Latest completed addition:** 03 User Authentication — 2026-07-04

---

## Build Phases

### Phase 1 — Foundation

- [x] 01 Monorepo scaffold
- [x] 02 Database schema
- [x] 03 User authentication
- [ ] 04 Admin authentication

### Phase 2 — Homepage + Search Foundation

- [ ] 05 Homepage UI
- [ ] 06 Search results UI
- [ ] 07 Admin hotel CRUD
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
