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
**Current feature:** 03 User Authentication
**Next up:** 03 User Authentication — better-auth instance for `frontend/` (email/password + Google OAuth), email verification, password reset. Once the `user` table exists, add the deferred FK constraints on `bookings.user_id`, `reviews.user_id`, `favorites.user_id`, `recent_searches.user_id` (see Architecture Decisions below).
**Blocking issues:** None
**Latest completed addition:** 02 Database Schema — 2026-07-04

---

## Build Phases

### Phase 1 — Foundation

- [x] 01 Monorepo scaffold
- [x] 02 Database schema
- [ ] 03 User authentication
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
