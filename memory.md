# Memory — Feature 55 Profile page, complete. Phase 17 fully done in repo.

Last updated: 2026-08-01

## What was built

**Feature 55 Profile page** — `frontend/app/profile/page.tsx` (server component, redirects to `/login` on a null session, same pattern as `bookings/page.tsx`) plus a new `frontend/features/profile/`:

- `constants.ts` — 8 fixed DiceBear (`notionists` style) seed URLs
- `components/ProfilePageContent.tsx` — composes the three panels + a quiet links row to `/bookings`/`/favorites`
- `components/AvatarNamePanel.tsx` — avatar picker grid (click → `authClient.updateUser({avatarUrl})`) + display-name field/save
- `components/EmailPanel.tsx` — read-only email, Verified/Not-verified pill, throttle-aware resend ("check your inbox", never "sent")
- `components/PasswordPanel.tsx` — calls `authClient.listAccounts()`, branches to `ChangePasswordForm` or `SetPasswordForm`
- `components/ChangePasswordForm.tsx` — `authClient.changePassword({currentPassword, newPassword})`
- `components/SetPasswordForm.tsx` — calls the new backend endpoint via `apiClient.post("/users/set-password", ...)`

Backend: new `backend/src/routes/users.routes.ts` + `controllers/users.controller.ts` + `types/user.schemas.ts` — `POST /users/set-password` (`requireAuth` → `auth.api.setPassword`), mounted in `routes/index.ts`.

Shared fix: `frontend/lib/auth-client.ts` gained the `inferAdditionalFields` client plugin (explicit schema, `{user: {avatarUrl: {type: "string", required: false}}}`) so `session.user.avatarUrl` is typed — it wasn't before.

**Nothing from this session is committed yet** — confirmed via `git log`, HEAD is still `bec4fe8` (Feature 54's memory-save commit). All of Feature 55's backend/frontend files plus the `progress-tracker.md`/`ui-registry.md` edits are sitting as uncommitted working-tree changes on `feature/52-email-send-throttle`. Not an oversight — the developer never asked for a commit this session, and the project rule is to only commit when explicitly asked. **Next session (or later this one): ask whether to commit, and if so split it the usual way — `feat(backend)`, `feat(frontend)`, `docs(context)`, per the one-commit-per-concern rule.**

## Decisions made

- **Avatar is a DiceBear picker, not a file upload.** Developer overrode the original plan mid-session — no S3, no multer, no multipart route at all. Simpler than `iteration-plan.md` anticipated.
- **Google-linked accounts can also set a password** — developer explicitly wants both sign-in methods available, not one-or-the-other. This meant adding the one new backend route: better-auth's `setPassword` (for the "no password yet" case) is marked `serverOnly` in the library and is unreachable from `authClient` in the browser, so a thin Express route calling `auth.api.setPassword` server-side was the only way. `PasswordPanel` branches on `authClient.listAccounts()` finding a `credential`-provider account — never on whether `google` is linked.
- **`inferAdditionalFields` needed an explicit schema object**, not the generic `<typeof auth>` form — `frontend/` and `backend/` are independent packages with no workspace linkage, so there's no way to import the backend's `auth` instance type into the frontend.

## Problems solved

- **better-auth's `setPassword` is `serverOnly`** — confirmed by reading `node_modules/better-auth/dist/api/routes/update-user.mjs`. Any future need for another `serverOnly` better-auth endpoint from the frontend should follow the same pattern: a thin Express route calling `auth.api.<endpoint>` directly.
- **Resend rejects `@example.com` as undeliverable** — real signup/resend calls to a fake test address fail outright rather than silently no-op. To test the throttle's silent-suppression success path, a row was inserted directly into `email_send_throttles` rather than relying on two real sends.
- **This sandbox's Playwright↔backend round-trips run ~15–20s slow** (Resend API latency, DB pooler latency, or both) — early verification scripts with 2–3s fixed waits reported false failures (looked like "Could not resend"/"stuck saving") that were actually just slow, not broken. Fixed by waiting on `page.waitForURL`/longer fixed waits and cross-checking against direct DB queries instead of trusting short timeouts.
- **The better-auth version mismatch flagged in earlier sessions' memory appears resolved** — checked this session, both `frontend/node_modules/better-auth` and `backend/node_modules/better-auth` are `1.6.23`.

## Current state

**Phase 17 (Features 52–55) is now fully complete in the repo.** Nothing in the phase is deployed yet. `tsc --noEmit`/`pnpm build` (backend) clean; `pnpm lint` shows only the pre-existing expected `no-img-element` warning on `app/page.tsx`.

**Important — this session ran verification against production by mistake.** `backend/.env`'s active (uncommented) `DATABASE_URL` defaults to the production Supabase pooler, not local dev — the localhost line is commented out. This session ran `pnpm migrate` and a full Playwright pass without overriding it first. Consequences, all confirmed and handled:
- Migration `0005` (Feature 52's `email_send_throttles` table) is now live on **production**, ahead of its code deploying. Developer confirmed: leave it in place (additive, harmless until Feature 52's backend code ships).
- A real test signup (`feature55.<timestamp>@example.com`) briefly existed in production's `user`/`account`/`session` tables — fully deleted afterward, verified no orphaned rows.
- Two real calls went out through production's Resend account to that (undeliverable) address.
- No real user's data was read, written, or touched.

`progress-tracker.md` now has a standing rule about checking `DATABASE_URL` before running migrations or verification locally — **read it and override the URL inline before touching either next session.**

Verified working end-to-end: avatar select, name change, resend-verification throttle copy, password change (persisted across reload/re-login), and the Google-only branch (tested by deleting the test account's `credential` row directly while the session stayed valid — same code path a real Google-only account hits). Screenshotted at 1280px and 390px, no layout issues.

## Next session starts with

**Nothing is planned past Feature 55** — `iteration-plan.md` ends here, so there's no pre-written next feature. Options to raise with the developer:

1. **Commit this session's work** — nothing is committed yet (see Current state). Split per the usual convention before anything else happens on this branch.
2. **Deploy Phase 17.** One Vercel push covers Features 53/54/55's frontend changes; one Render push covers Features 52/55's backend changes; migration `0005` is already live on production so no migration step is needed at deploy time.
3. Ask the developer what Phase 18 (if any) should cover, since no context file defines one yet.

## Open questions

- Whether the developer wants a proper local-only `DATABASE_URL` set up (e.g. uncommented by default, prod one commented instead) to stop this mistake from recurring a third time.
- Everything else carried from Features 52/53's memory that's still genuinely open: the 20-minute throttle window's tunability, missing env vars in `code-standards.md`'s table, whether `--border-strong`/`--rating-star-empty` are exactly right, whether success/warning read right stacked against `--state-info`. None of these were touched this session.
- Whether `next/image` should be reconsidered later now that the `priority`→`preload` deprecation is on record (still no live `next/image` usage anywhere in `frontend/` to point to as a corrected example) — not raised again this session.
