# Memory — Feature 02 Database Schema

Last updated: 2026-07-04

## What was built

All 13 app-specific tables from `architecture.md`'s Database Schema section, created via 5 grouped migrations in `backend/migrations/`, run through the existing `pnpm migrate` runner from Feature 01:

- `0002_create_hotels.sql` — `hotels`, `hotel_images`, `amenities`, `hotel_amenities`
- `0003_create_room_types.sql` — `meal_plans`, `room_types`, `room_features`, `room_type_features`, `room_type_images`, `rate_overrides`
- `0004_create_bookings_reviews.sql` — `bookings`, `reviews`
- `0005_create_favorites_recent_searches.sql` — `favorites`, `recent_searches`
- `0006_hotels_location_gist_index.sql` — GiST index on `hotels.location`

better-auth's own tables (`user`/`session`/`account`/`verification`, `admin_user`/`admin_session`) were **not** created — out of scope, they arrive with Features 03/04.

`backend/src/config/seed.ts` (new, run via `pnpm seed`, added to `backend/package.json` scripts) — truncates and re-inserts demo data: 8 amenities, 5 room features, 4 meal plans, and 5 hotels (Hotel Marais Charme + Le Louvre Riverside in Paris, Shibuya Sky Hotel + Asakusa Ryokan Inn in Tokyo, Midtown Manhattan Hotel in New York), each with 2 room types, real geography points, images, and amenity/feature links.

`context/progress-tracker.md` updated: Feature 02 marked complete, 5 architecture decisions logged, session note added, status moved to Feature 03.

## Decisions made

- **Deferred user FKs**: `bookings.user_id`, `reviews.user_id`, `favorites.user_id`, `recent_searches.user_id` are plain `uuid` columns with no `REFERENCES` clause — the `user` table doesn't exist until Feature 03 (better-auth generates it). Feature 03 must add the FK constraints via `ALTER TABLE` once that table exists.
- **RESTRICT vs CASCADE**: `ON DELETE RESTRICT` on `bookings`/`reviews`' FKs to `hotels`/`room_types` (financial/historical records never silently disappear) — a hotel with any booking/review history can't be hard-deleted. `ON DELETE CASCADE` everywhere else (structurally-owned child rows: images, join tables, `rate_overrides`, `room_types` under `hotels`, `favorites`/`recent_searches.hotel_id`). `ON DELETE SET NULL` on `room_types.meal_plan_id` (a lookup reference, not ownership).
- **UUIDs**: `gen_random_uuid()` (built into Postgres 13+ core) — no `uuid-ossp`/`pgcrypto` extension needed.
- **Status fields**: `hotels.status`/`bookings.status` are `text` + `CHECK (... IN (...))` constraints, not native Postgres `ENUM` types — readable in query output, DB-enforced, no `ALTER TYPE` ceremony to add a value later.
- **Migration granularity**: 5 files grouped by domain (not one giant file, not one-per-table) — matches Feature 01's one-migration-per-logical-change precedent.
- **Seed tooling**: TS script (`seed.ts`, `pnpm seed`) matching `migrate.ts`'s pattern, not a raw `.sql` seed migration — truncate-then-insert so it's safely re-runnable in local dev. Scoped to hotels/room types/amenities/lookups only, no bookings/reviews/favorites (those need real users).

## Problems solved

- `tsc` rejected `backend/src/config/seed.ts`'s `insertLookupTable` helper: passing `Record<string, string>[]` rows meant `row.name` typed as `string | undefined` under `noUncheckedIndexedAccess` (mandated in `code-standards.md`), even though `name` is always present. Fixed by replacing the generic `Record<string, string>` param with an explicit `LookupRow { name: string; icon?: string }` interface. **Worth remembering for future generic "iterate arbitrary key/value rows" code in this codebase** — prefer named interfaces over `Record<string, T>` whenever `noUncheckedIndexedAccess` is on and a field is guaranteed to exist.
- Enforced "exactly one `is_main = true` per hotel/room type" (a note in `architecture.md`, not just a column comment) via partial unique indexes (`hotel_images_one_main_per_hotel_idx`, `room_type_images_one_main_per_room_type_idx`) rather than relying on app-layer discipline.

## Current state

Migrations applied and seed data inserted against the developer's real local Postgres instance (`backend/.env`'s `DATABASE_URL`, not a scratch DB this time — it was left in place, not dropped). Verified:
- All 16 tables (13 app tables + `schema_migrations` + `spatial_ref_sys` + PostGIS system table) exist via `\dt`.
- `hotels_location_gist_idx` exists and is actually used by the query planner (`EXPLAIN` on an `ST_DWithin` query shows an Index Scan).
- `pnpm seed` run twice back-to-back with no errors or duplicate rows (5 hotels, 8 amenities each time).
- `pnpm build` (tsc) typechecks clean with zero errors.

A developer starting Feature 03 can build directly against this database — no need to re-run `pnpm migrate`/`pnpm seed` first, though re-running `pnpm seed` is always safe (it truncates and re-inserts).

## Next session starts with

Feature 03 User Authentication (see `build-plan.md`): configure a better-auth instance for `frontend/` — email/password + Google OAuth, email verification flow (unverified accounts can browse but not book), password reset flow. `/login`, `/signup`, `/verify-email` pages. Once the `user` table exists, add the deferred FK constraints (`ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY (user_id) REFERENCES "user"(id)`) to `bookings`, `reviews`, `favorites`, `recent_searches` as part of the same feature's migration.

## Open questions

None outstanding — all Feature 02 decisions were confirmed with the developer before implementation (see `/architect` session this same day).
