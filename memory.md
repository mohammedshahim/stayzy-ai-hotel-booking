# Memory — Feature 03 User Authentication

Last updated: 2026-07-04

## What was built

**Backend:**
- `backend/src/config/auth.ts` — better-auth user instance (email/password + Google OAuth), mounted at `/api/auth/*` via `backend/src/routes/auth.routes.ts`, before `express.json()` in `backend/src/app.ts` (better-auth parses its own raw body)
- `backend/src/services/email.service.ts` — Resend wrapper for verification + password reset emails (client constructed lazily so a missing API key doesn't crash module load)
- `backend/src/middlewares/requireAuth.ts`, `backend/src/middlewares/cors.ts`
- `backend/src/types/express.d.ts` — augments `Request.user` with the better-auth session user type
- `backend/migrations/0007_create_auth_tables.sql` — better-auth's own schema (`user`/`session`/`account`/`verification`), generated via `@better-auth/cli generate` and hand-adapted to this project's migration style
- `backend/migrations/0008_add_user_fk_constraints.sql` — retypes `bookings.user_id`/`reviews.user_id`/`favorites.user_id`/`recent_searches.user_id` from `uuid` to `text`, then adds the deferred FK constraints
- `backend/.env`/`.env.example` — added `APP_URL`, `RESEND_API_KEY`, `EMAIL_FROM`
- `resend` added to `backend/package.json` and the approved dependency list in `code-standards.md`

**Frontend:**
- `frontend/lib/auth-client.ts` — better-auth React client, no `baseURL` (defaults to same-origin `/api/auth`)
- `frontend/next.config.ts` — rewrites `/api/auth/:path*` to the backend
- `frontend/proxy.ts` — route guard for `/checkout`, `/bookings`, `/profile` (checks session-cookie presence only; this file was `middleware.ts` before a mid-session rename, see Problems Solved)
- `frontend/features/auth/components/` — `AuthCard`, `LoginForm`, `SignupForm`, `ForgotPasswordForm`, `ResetPasswordForm`, `VerifyEmailStatus`, `GoogleSignInButton`
- 5 pages: `frontend/app/login`, `/signup`, `/verify-email`, `/forgot-password`, `/reset-password`
- `frontend/components/ui/input.tsx`, `label.tsx`, `card.tsx` added via shadcn CLI
- `frontend/.env.local` created (`NEXT_PUBLIC_API_BASE_URL=http://localhost:4000`)

**Docs updated:** `project-overview.md` (added `/forgot-password`, `/reset-password` to the page list), `code-standards.md` (resend dependency), `library-docs.md` (corrected better-auth section), `ui-tokens.md`/`ui-rules.md`/`ui-registry.md` (border-token bug fix + new `AuthCard`/`Auth Form Layout` entries + corrected `Input` pattern), `progress-tracker.md` (Feature 03 marked complete with full decision log).

## Decisions made

- **Local dev cookie strategy:** Next.js `rewrites()` proxy (`/api/auth/:path*` → backend) instead of direct cross-origin fetch, so the session cookie is same-origin in the browser. Mirrors the production shared-subdomain setup instead of relying on cross-port-same-site browser nuances.
- **`requireEmailVerification: false`, not `true`:** `true` blocks sign-up from creating a session at all and blocks sign-in for unverified users — contradicts the agreed design (sign-up logs the user in immediately; verification is only checked at booking creation, later).
- **Real Resend email delivery from the start** (developer's explicit choice over a console-log placeholder).
- **better-auth's own tables** are generated via its CLI and hand-adapted into this project's numbered-migration convention, not left to auto-migrate at runtime.
- **`user_id` FK type:** better-auth uses `text` ids, not `uuid` — the four deferred columns were retyped to match rather than forcing `uuid` ids out of better-auth. `RESTRICT` on `bookings`/`reviews` (financial/historical), `CASCADE` on `favorites`/`recent_searches` (convenience data).

## Problems solved

- The original `library-docs.md` better-auth snippet had `requireEmailVerification: true`, which silently breaks the "browse while unverified" design — found by testing signup and seeing `token: null` in the response, traced to better-auth's source, fixed to `false` in both the code and the docs.
- This Next.js version (16.2.10) renamed the `middleware.ts` file convention to `proxy.ts` (function renamed `middleware` → `proxy`) — caught from a dev-server deprecation warning after the fact, not from reading `node_modules/next/dist/docs/` first as `frontend/AGENTS.md` warns to do. Renamed and fixed; worth checking those docs *before* writing Next-version-sensitive code next time.
- `ui-tokens.md`/`ui-rules.md`/`ui-registry.md` documented `border-default`/`border-subtle`/`border-strong` as Tailwind classes, but the real generated classes are `border-border-default`/`border-border-subtle`/`border-border-strong` (verified by compiling actual Tailwind output). Fixed in all three docs plus the new auth components.
- The pre-locked `Input` pattern in `ui-registry.md` used `focus:` but the real shadcn/base-ui `Input` primitive only responds to `focus-visible:` — fixed on first real use.

## Current state

Both dev servers run locally (`backend` :4000, `frontend` :3000) against the developer's real local Postgres instance. Full flow verified end-to-end via curl (no browser automation tool was available this session): signup creates a session immediately, `get-session` round-trips through the proxy, password reset (request → token pulled from DB → reset → login with new password) works fully, Google OAuth URL generation resolves to the correct proxied redirect URI. `tsc` and `next build` are both clean; all 5 auth pages render 200 in a production build.

`RESEND_API_KEY` is still empty in `backend/.env` — real verification/reset emails fail silently (logged server-side, not thrown) until a real key is added. Test users created during verification were deleted from the `user` table afterward.

## Next session starts with

Feature 04 Admin Authentication (see `build-plan.md`): separate better-auth instance for `frontend-admin/`, email/password only with no public sign-up, seeded initial admin account, admin route guard. `frontend-admin/` is Vite, not Next.js, so Feature 03's `rewrites()`-proxy trick has no direct equivalent — decide the local-dev cross-origin cookie strategy for it explicitly (Vite dev-server proxy vs. plain CORS) before building the admin login UI.

## Open questions

- `frontend-admin/`'s local-dev cookie strategy is unresolved — needs a decision at the start of Feature 04.
- Developer still needs to add a real `RESEND_API_KEY` to `backend/.env` to see actual verification/reset emails land in an inbox.
- Google Cloud Console's OAuth client needs `http://localhost:3000/api/auth/callback/google` registered as an authorized redirect URI, if it isn't already (unconfirmed whether the developer has done this).
