# Memory — Feature 04 Admin Authentication

Last updated: 2026-07-05

## What was built

**Backend:**
- `backend/src/config/auth-admin.ts` — second, fully independent better-auth instance for `frontend-admin/`: email/password only, no social providers, no sign-up route ever mounted. Own `admin_user`/`admin_session`/`admin_account`/`admin_verification` tables via `modelName` overrides. Mounted at `/api/admin/auth/*` (before `express.json()`) via `backend/src/routes/admin/auth.routes.ts`.
- `backend/src/middlewares/requireAdmin.ts` — mirrors `requireAuth.ts`, checks the admin instance's session, attaches `req.adminUser`.
- `backend/src/config/seed-admin.ts` (`pnpm seed:admin`) — creates the one initial admin account via `authAdmin.api.signUpEmail` server-side (not a raw SQL insert), reads `ADMIN_SEED_EMAIL`/`ADMIN_SEED_PASSWORD`, skips safely if that email already exists.
- `backend/migrations/0009_create_admin_auth_tables.sql` — generated via `@better-auth/cli generate` against a throwaway re-export config, hand-adapted into this project's migration style.
- `backend/src/middlewares/cors.ts` — now checks the request `Origin` against `[APP_URL, ADMIN_APP_URL]` and echoes back whichever matches (never `*`), instead of a single hardcoded origin.
- New env vars: `ADMIN_APP_URL`, `API_URL`, `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD` (added to `env.ts` and `.env.example`).
- `backend/src/types/express.d.ts` — adds `Request.adminUser`.

**Frontend-admin:**
- `frontend-admin/src/features/auth/authApi.ts` — RTK Query slice calling the admin instance's REST endpoints directly (`sign-in/email`, `get-session`, `sign-out`) — no better-auth client SDK.
- `frontend-admin/src/features/auth/components/` — `AuthCard`, `LoginForm`, `LoginPage` (ported from `frontend/`'s Feature 03 patterns, minus Google/signup/forgot-password), and `ProtectedRoute` (new pattern: React Router layout route wrapping `useGetSessionQuery`, loading state → `<Outlet />` or `<Navigate to="/login?returnTo=...">`).
- `frontend-admin/src/components/ui/{card,input,label}.tsx` — ported byte-for-byte from `frontend/`, since both apps share the same `@base-ui/react` primitives and token remapping.
- `frontend-admin/src/router/routes.tsx` / `app/store.ts` — wired `/login` to `LoginPage`, everything else behind `ProtectedRoute`; `authApi` registered in the store.
- `frontend-admin/.env.local` created (`VITE_API_BASE_URL=http://localhost:4000`, gitignored).

**Docs updated:** `library-docs.md` (admin better-auth snippet completed with `baseURL`/`trustedOrigins`/`modelName`/`cookiePrefix`, corrected the stale "needs a rewrite proxy" guidance, added "Admin Client Usage" section), `code-standards.md` (env var table), `ui-registry.md` (new "Admin AuthCard / Login Form" and "Route Guard (ProtectedRoute)" entries), `progress-tracker.md` (Feature 04 marked complete with full decision log).

## Decisions made

- **CORS + `credentials: include`, not a Vite proxy**, for admin auth's local-dev cross-origin cookie strategy. `apiBaseQuery.ts`/`cors.ts` were already scaffolded this way in Feature 01; `localhost:5173`/`localhost:4000` are same-site (same registrable domain, different port) so no `SameSite` issues.
- **`advanced.cookiePrefix: "admin"`** on the admin instance — both instances share the same backend host, and better-auth's default cookie name (`better-auth.session_token`) would otherwise collide between them, silently overwriting whichever session was set last.
- **No better-auth client SDK in `frontend-admin/`** — `authApi.ts` calls the REST endpoints directly via RTK Query, matching the approved-dependency list and the "all admin calls go through RTK Query" rule.
- **Admin account seeded via `authAdmin.api.signUpEmail` server-side**, not a raw SQL insert — guarantees the password hash always matches better-auth's own hasher.
- **`role` additionalField** (`admin`/`super_admin`, default `admin`) added to `admin_user` per `architecture.md`'s schema, but no role-gated logic built yet — nothing needs it until a later admin feature.

## Problems solved

- Both better-auth instances defaulted to the identical cookie name (`better-auth.session_token`). Since they're mounted on the same backend host with the same cookie path, logging into one would have silently overwritten the other's session cookie in the browser. Caught during end-to-end verification (tested both sessions in the same cookie jar before/after the fix), fixed with a distinct `cookiePrefix`.
- `library-docs.md`'s original guidance said Feature 04 needed the same Next.js rewrites()-proxy trick as Feature 03 — but that contradicted `apiBaseQuery.ts`'s `credentials: "include"` (only meaningful for direct cross-origin calls). Resolved in favor of the already-built CORS approach; docs corrected.
- `@better-auth/cli generate` requires the config file to export `auth` (default or named) — `auth-admin.ts` exports `authAdmin`. Worked around with a throwaway re-export file (`auth-admin.generate.ts`, deleted after use) rather than renaming the real export.

## Current state

Both dev servers verified against the developer's real local Postgres instance. Migration `0009` applied, `pnpm seed:admin` creates the seeded admin (`admin@stayzy.dev`, credentials in the real untracked `.env`, not repeated here) and safely no-ops on re-run. Login → `get-session` → `sign-out` round-trip a session cookie cross-origin with correct CORS headers (verified via curl with an `Origin: http://localhost:5173` header). `requireAdmin` tested directly via a throwaway route (401 with no cookie, passes through with one), removed after. Both instances' cookies confirmed to coexist without collision. Both `backend` (`tsc`) and `frontend-admin` (`tsc -b && vite build`) are clean. All changes committed (4 commits: backend admin auth, frontend-admin auth UI, docs fixes, progress-tracker log) and pushed to `origin/main`.

No browser automation tool was available this session, so the admin login UI was verified via `vite build` + curl against the dev server, not visually in a browser.

Noticed but not touched: several stray crash-looping `tsx watch` processes from past sessions competing for port 4000 (harmless, just clutter — a manual `pkill` would tidy them up if desired).

## Next session starts with

Feature 05 Homepage UI (see `build-plan.md`): Navbar (logo, login/account state), hero search widget (destination input, check-in/check-out date range, guests + rooms breakdown), trending destinations section (static placeholder data for now), footer. Search widget should be interactive but doesn't need to navigate anywhere real yet — that's Feature 09 (Search Backend Wiring).

## Open questions

- None blocking. A quick visual/browser pass over the admin login page would be worthwhile next time a browser is available, since this session's UI verification was curl/build-only.
