# Memory — Backend Data Layer Migration to Drizzle ORM

Last updated: 2026-07-07

## What was built

Infra migration (not a numbered `build-plan.md` feature) — moved the entire `backend/` data layer from raw `pg` queries to Drizzle ORM, with a full clean-slate rebuild of the local dev database and hand-rolled migration downgrade support on top of drizzle-kit (which has no native "down" migration concept).

- **`src/models/*.schema.ts`** (new, one file per domain): `hotel.schema.ts`, `room-type.schema.ts`, `booking.schema.ts`, `favorite.schema.ts`, `auth.schema.ts`, `admin-auth.schema.ts` — Drizzle `pgTable(...)` definitions for all 22 tables (14 app tables + both better-auth instances' tables). `hotel.model.ts` deleted; its hand-written view types (`Hotel`, `HotelInput`, etc.) moved into `hotel.schema.ts` unchanged since they don't map 1:1 to the raw table row.
- **`hotels.location`** (PostGIS geography) uses a hand-written `customType` (`geographyPoint` in `hotel.schema.ts`) — writes via `ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography`, reads back via `ST_Y`/`ST_X` in the query layer (same shape as before, different mechanism).
- **`src/config/db.ts`** now exports `pool` (raw `pg.Pool`, used by seed scripts/`migrate-down.ts` for `.end()`/raw SQL) and `db` (`drizzle(pool, { schema })`, the merged schema across all domains).
- **`src/queries/{hotels,hotel-images,amenities}.queries.ts`** — the only 3 files that ever touched raw SQL — rewritten against the Drizzle query builder, every function's signature/return shape preserved exactly. `setHotelAmenities`/`reorderHotelImages` use `db.transaction()`.
- **`src/config/{seed,seed-admin}.ts`** rewritten with `db.insert(...).values(...).returning(...)`.
- **`src/config/auth.ts` / `auth-admin.ts`** now use `drizzleAdapter(db, { provider: "pg", schema: {...} })`. Admin instance's schema keys are deliberately snake_case (`admin_user`, `admin_session`, etc.) — `drizzleAdapter` resolves models via `db.query[modelName]`, and modelName is the literal remapped string, not just "the same table by any name."
- **Old tooling deleted**: `backend/migrations/*.sql`, `src/config/migrate.ts`. Replaced by `drizzle.config.ts` + `drizzle/` (drizzle-kit-generated migrations).
- **New downgrade mechanism**: `drizzle/0000_baseline.down.sql` (hand-authored, reverses the baseline exactly — drops all 22 tables then `DROP EXTENSION IF EXISTS postgis`), `src/config/migrate-down.ts` (`pnpm migrate:down` — reads `drizzle/meta/_journal.json` + the `drizzle.__drizzle_migrations` tracking table, runs the matching `.down.sql` in a transaction, deletes the tracking row). `pnpm migrate` now runs `drizzle-kit migrate` instead of the old hand-rolled runner.

## Decisions made

- **Full scope**: all 22 tables got Drizzle schema now, not just the 4 with existing query files — developer wanted the whole data layer moved in one pass, not incrementally.
- **Clean slate**: local dev DB was dropped (`DROP SCHEMA public CASCADE`) and rebuilt from a fresh drizzle-kit-generated baseline — developer confirmed no local data was worth preserving.
- **Hand-authored `.down.sql` discipline**: since drizzle-kit only generates forward migrations, every future schema change must ship a matching `.down.sql` in the same commit — documented as a hard rule in `library-docs.md`, not enforced by tooling. A missing `.down.sql` makes `pnpm migrate:down` fail loudly rather than silently no-op.
- **Preserve hand-written view types where they exist** (`Hotel` etc. in `hotel.schema.ts`) rather than force them to `$inferSelect`, since they're already flattened/formatted views over the raw row (lat/lng instead of the geography column, `"HH:MM"` instead of raw `"HH:MM:SS"`). New domains with no prior model file (bookings, favorites, room types) just use `$inferSelect`/`$inferInsert` directly under the names a hand-written interface would have used.

## Problems solved

- **drizzle-kit's `customType` SQL output needed a manual fix**: the generated baseline emitted `"location" "geography(Point,4326)" NOT NULL` (quoted as if it were an identifier), which is invalid Postgres syntax for a type name with parameters. Fixed by hand-editing the generated migration to remove the quotes.
- **PostGIS extension isn't managed by drizzle-kit**: `CREATE EXTENSION IF NOT EXISTS postgis;` had to be hand-prepended to the generated baseline migration (and `DROP EXTENSION IF EXISTS postgis;` appended to the down file) — drizzle-kit's schema diffing has no concept of extensions.
- **Real bug found during verification**: `listHotels`' `mainImageUrl` correlated subquery returned `null` for every row. Root cause: a raw Drizzle `sql` template renders an interpolated `PgColumn` as its bare *unqualified* name, not table-qualified — so `${hotelImages.hotelId} = ${hotels.id}` inside a subquery FROM `hotel_images` silently resolved `hotels.id` to `hotel_images`'s own `id` column instead (since both tables have an `id` column). Fixed by qualifying the outer reference as a literal string: `` sql`... = "hotels"."id"` ``. Documented as a general gotcha in `library-docs.md`'s PostGIS and Drizzle ORM sections — will bite again on any future correlated subquery.

## Current state

Fully migrated, verified, and documented. `tsc --noEmit`/`pnpm build` clean. Verified end-to-end against the real local Postgres instance: fresh `pnpm migrate` (drizzle-kit) applied cleanly to an empty DB, `pnpm seed`/`pnpm seed:admin` both idempotent, hit real admin hotel endpoints over HTTP (list/detail/update/soft-delete, amenities — all correct, including the `mainImageUrl` fix), both better-auth instances verified over HTTP (admin sign-in/get-session, user sign-up/get-session — test user deleted after), and a full `pnpm migrate:down` → `pnpm migrate` cycle confirmed (all 22 tables + postgis extension actually dropped, then fully restored).

DB was left in a clean, fully-seeded state (5 demo hotels, 1 admin account) after the delete/rollback testing. Backend dev server left running on :4000.

All four context files updated: `architecture.md` (file tree, system boundaries table), `code-standards.md` (Query Pattern example, approved-dependency list), `library-docs.md` (PostGIS section rewritten, new "Drizzle ORM" section covering schema files/adapter wiring/migration discipline), `progress-tracker.md` (2 new Architecture Decisions entries, 1 new Session Notes entry, Current Status corrected).

## Next session starts with

Feature 08 Admin Room Type CRUD — read `build-plan.md`'s section for it (room type management nested under `/hotels/[id]`, CRUD endpoints for `room_types`/`room_type_features`/`room_type_images`, rate override management for seasonal pricing/blackout dates). This migration doesn't block it — same layered architecture, same query function signatures, just a different implementation underneath. An `/architect` session for Feature 08 was in progress before this migration was requested (language alignment on "room type"/"rate override"/"blackout date"/"seasonal pricing"/"free cancellation override" was proposed but not yet confirmed) — may want to resume that discussion rather than restart it.

## Open questions

- None blocking. The only carried-over open item is the pre-existing blank S3 credentials in `backend/.env` (unrelated to this migration) — image upload still fails cleanly but has never been exercised against a real bucket.
