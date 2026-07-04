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
**Current feature:** 02 Database Schema
**Next up:** 02 Database Schema — migrations for every table in `architecture.md`, GiST index, seed script
**Blocking issues:** None
**Latest completed addition:** 01 Monorepo Scaffold — 2026-07-04

---

## Build Phases

### Phase 1 — Foundation

- [x] 01 Monorepo scaffold
- [ ] 02 Database schema
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
