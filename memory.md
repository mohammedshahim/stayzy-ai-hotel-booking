# Memory — Feature 01 Monorepo Scaffold

Last updated: 2026-07-04

## What was built

Full monorepo scaffold, verified booting end to end:

- Root: `.gitignore`, `README.md`.
- `backend/` — Express + TypeScript. `src/config/env.ts` (zod-validated env), `src/config/db.ts` (pg pool), `src/app.ts` + `src/server.ts`, `GET /health` via the full `routes → controllers` pattern, `src/middlewares/errorHandler.ts`. Custom migration runner at `src/config/migrate.ts` (`pnpm migrate`), tracked via a `schema_migrations` table, reading `migrations/*.sql` in order. First migration `migrations/0001_enable_postgis.sql`.
- `frontend/` — Next.js 16 App Router + TypeScript + Tailwind v4 + shadcn/ui. Full `ui-tokens.md` token block wired into `app/globals.css`. All `features/*` and `components/*` folders scaffolded per `architecture.md`. `lib/api-client.ts` stubbed.
- `frontend-admin/` — Vite + React + TypeScript + Tailwind v4 + shadcn/ui. Same token block in `src/index.css`. Redux Toolkit store (`src/app/store.ts`, empty reducer), `react-router-dom` with placeholder `/login` and `/` routes, `src/lib/apiBaseQuery.ts`. All `features/*` folders scaffolded.
- `context/progress-tracker.md` updated: Feature 01 marked complete, decisions logged, session note added.
- `context/code-standards.md` updated: added `react-redux` to the `frontend-admin/` approved-dependency list.

## Decisions made

- No Docker — `backend/.env`'s `DATABASE_URL` points at whatever Postgres instance the developer already has (local install or cloud). No `docker-compose.yml` exists in this repo.
- Package manager is `pnpm`, used independently per app folder — no root workspace file, apps stay fully independent per `architecture.md`.
- Design tokens (`ui-tokens.md`) and shadcn/ui init happen in scaffold (Feature 01), not deferred to Feature 05 (Homepage UI).
- Schema changes go through the custom migration runner introduced here (`backend/migrations/000X_*.sql` + `schema_migrations` table) — Feature 02 must extend this same mechanism, not invent a new one.
- Backend uses CommonJS (`module: "CommonJS"`, no `"type": "module"`) instead of `NodeNext`, to avoid forcing `.js` extensions on relative imports — keeps imports matching every example in `code-standards.md`/`library-docs.md`.

## Problems solved

- `shadcn@latest init` injects its own dark-mode `.dark` block, a Geist font, and a default oklch color palette in both frontends — all removed/remapped by hand. Dark mode block and `@custom-variant dark` deleted (product is light-mode only per `ui-rules.md`). Geist font import removed, kept only Inter + JetBrains Mono. shadcn's semantic tokens (`background`, `foreground`, `card`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`, `chart-*`, `sidebar-*`) remapped onto the actual Stayzy palette instead of shadcn's defaults, so any shadcn primitive renders on-brand.
- shadcn's `--radius-*` scale (calc chain off `--radius`) was deliberately left intact rather than reverted to plain Tailwind radius, because `components/ui/button.tsx` references `--radius-md` directly — removing it breaks the generated primitive. Net effect: ~12.5% radius delta on `rounded-2xl`/etc. vs vanilla Tailwind. Flagged in `progress-tracker.md` to revisit if it's ever visually significant.
- `frontend-admin`'s shadcn CLI run mis-resolved the `@/` alias and wrote generated files into a literal `./@/` folder at the project root instead of `src/` — moved manually, stray folder deleted.
- Vite's `create-vite` template did not enable TypeScript strict mode in `tsconfig.app.json`/`tsconfig.node.json`, contradicting `code-standards.md`'s "strict mode always" rule — added by hand, along with `noUncheckedIndexedAccess`.
- `react-redux` had to be added as an explicit dependency in `frontend-admin/` — `@reduxjs/toolkit` alone has no React bindings (`Provider`, `useSelector`, `useDispatch`). Not in the original approved-deps list; `code-standards.md` updated to include it.

## Current state

All three apps verified booting independently:
- `backend`: `GET /health` → 200, `{ success: true, data: { status: "ok" } }`.
- `frontend`: boots on :3000, serves 200.
- `frontend-admin`: boots on :5173, serves 200.

Migration runner verified end-to-end against a real local Postgres instance (a scratch `stayzy` database was created, migrated, confirmed via `\dx` that `postgis 3.5.2` is installed, then dropped afterward — it was throwaway, not meant to persist).

No `.env` or `.env.local` files exist anywhere in the repo — only `.env.example` (backend, frontend, frontend-admin). A developer must create their own before running anything.

`progress-tracker.md` current status: Phase 1 — Foundation, Feature 01 complete, next up is Feature 02 Database Schema.

## Next session starts with

Feature 02 Database Schema (see `build-plan.md`): migrations for every table listed in `architecture.md` (`hotels`, `hotel_images`, `amenities`, `hotel_amenities`, `room_features`, `meal_plans`, `room_types`, `room_type_features`, `room_type_images`, `rate_overrides`, `bookings`, `reviews`, `favorites`, `recent_searches`), a GiST index on `hotels.location`, and a seed script with demo data — all added as new numbered `.sql` files under `backend/migrations/`, run via the existing `pnpm migrate`. Before starting, the developer needs a real `backend/.env` with `DATABASE_URL` pointing at their own Postgres instance (the verification database from this session was dropped).

## Open questions

None outstanding — all Feature 01 decisions were confirmed with the developer before implementation (see `/architect` session this same day).
