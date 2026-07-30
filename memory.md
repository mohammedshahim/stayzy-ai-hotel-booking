# Memory — Feature 52 Email send throttle, complete. Phase 17 open.

Last updated: 2026-07-30

## What was built

**Feature 52 Email send throttle** — one transactional auth email per `(recipient, purpose)` per 20 minutes. Three commits, all on branch **`feature/52-email-send-throttle`**, none on `main`, nothing pushed:

- `c97a7e7` `feat(backend)` — the feature and its migration
- `9d23a98` `chore(deploy)` — `EMAIL_THROTTLE_WINDOW_MINUTES` declared in `render.yaml`
- `a00a7bf` `docs(context)` — tracker, architecture, code standards

Files: new `backend/src/models/email.schema.ts` (`email_send_throttles`, composite unique on `(recipient, purpose)`, plus the `EmailPurpose` union), new `backend/src/queries/email-throttle.queries.ts`, migration `backend/drizzle/0005_add_email_send_throttles.sql` with its hand-written `.down.sql`, a private `sendThrottledEmail` in `backend/src/services/email.service.ts` that both exported senders now route through, and `EMAIL_THROTTLE_WINDOW_MINUTES` added to `env.ts`, `.env.example` and `render.yaml`. `config/auth.ts` was not touched.

## Decisions made

- **The throttle wraps a new opt-in path, not `sendEmail` itself.** Gating the shared helper would silently give a future booking-confirmation email a 20-minute cooldown, so a user who books twice gets one email. A purpose opts in by name; the two purposes carry independent clocks.
- **Read → send → record, not an atomic claim.** Chosen by the developer over an `INSERT ... ON CONFLICT ... WHERE ... RETURNING` claim, against the recommendation, with the trade understood. Cost: a race the width of the Resend call where two interleaved requests both send — bounded by the unique constraint to a duplicate email, never a broken row. Upside: a send that throws records nothing, so a provider outage never costs a user their window.
- **The senders return `Promise<boolean>` rather than `void`**, also against the recommendation. No caller reads it. This moved the disclosure risk from *impossible* to *a rule someone must remember*, so the rule is now an invariant in `architecture.md`: nothing may branch on that boolean in a way the client can observe. better-auth's password-reset response is deliberately identical for a known and an unknown address.
- **No FK to `user`; the key is the lowercased email.** Same reasoning already recorded for `compare_ai_summaries` — the key is an address, not an entity elsewhere.
- **Minutes, not milliseconds**, following `BOOKING_EXPIRY_MINUTES`; the `_MS` suffix in `env.ts` belongs to the rate limiters.

## Problems solved

- **`backend/.env`'s active `DATABASE_URL` is the production Supabase pooler — the localhost line is commented out.** So `pnpm migrate` from this checkout hits **production** by default. This was caught before running anything. All verification was done by exporting the commented-out local URL inline (`export DATABASE_URL=$(grep '^# DATABASE_URL=' .env | sed 's/^# DATABASE_URL=//')`), which works because `dotenv` does not override an already-set `process.env` key. `.env` itself was never edited.
- **The reset endpoint is `/api/auth/request-password-reset`, not `/forget-password`** — the latter 404s. `frontend/features/auth/components/ForgotPasswordForm.tsx` calls `authClient.requestPasswordReset`.
- **better-auth skips the `sendVerificationEmail` callback entirely when the account is already verified**, returning `{status:true}` with no send. Testing the verification purpose needs an unverified account — done by temporarily flipping `emailVerified` on the developer's own dev account and restoring it afterwards.
- The `@example.com` and `@stayzy-seed.example` users in the local dev DB are useless for real send tests; Resend rejects them.

## Current state

`pnpm build` clean, working tree clean, on branch `feature/52-email-send-throttle` (3 commits ahead of `main`, unpushed).

Verified against the real running app on the **local** database: two reset requests inside the window produced one send and one `console.warn` with both HTTP bodies byte-identical under `cmp`; an uppercase address hit the same row; the verification purpose sent while the reset window was open, then suppressed on its own retry; backdating `last_sent_at` past the window let the next send through and refreshed the row in place, proving the throttle releases rather than locking out. Migration rolled back (`to_regclass` null) and forward once. Test rows deleted and the flipped `emailVerified` flag restored.

**Production has neither the code nor migration `0005`.** `render.yaml` has no migrate step, so the migration is applied by hand.

Context updated in three files: `progress-tracker.md` (status, completed entry, session note, open item, one standing rule), `architecture.md` (the `email_send_throttles` schema section and one invariant on silent suppression), `code-standards.md` (the env var row). `iteration-plan.md` and `build-plan.md` deliberately untouched — only 1 of 16 AI features was ever marked shipped in its plan file, so the tracker is the completion record.

## Next session starts with

**Feature 53 — frontend palette re-skin.** Read `iteration-plan.md`'s section for it first, including the three derivation traps it names: the three `--shadow-*` rgba values live in `@theme inline` and not `:root` (so they sit outside the block being edited and will read as a warm smudge under teal), `#C6A664` fails WCAG AA as text on white and needs its own darker text tier, and `#C6A664` collides with `--rating-star` `#F2A93B` — which `ui-tokens.md` argues at length must stay separate from the brand accent, so that section needs correcting either way. `frontend-admin/src/index.css` stays untouched, and that deviation from the shared-token rule must be recorded in `ui-tokens.md`.

Two carry-overs to handle before or alongside it:

1. **Apply migration `0005` to production** before or with the deploy of Feature 52's code — otherwise every auth email throws against a missing table. Remember the `DATABASE_URL` situation above.
2. **Decide what happens to `feature/52-email-send-throttle`.** The repo's history is linear on `main`; the branch exists because the harness branches off a default branch by default. It is one merge away.

## Open questions

- Is 20 minutes a fixed product rule or a starting value to tune? Behind an env var either way — treated as tunable.
- Whether the accepted send race ever matters in practice. It is bounded to a duplicate email and is recorded in the tracker; if duplicates show up in the Resend log, the atomic-claim shape is the fix.
- Minor, noticed but not acted on: `backend/package.json` pins `better-auth: ^1.2.7` while `frontend/package.json` pins `^1.6.23`. Not investigated, not related to this feature.
- Pre-existing gap left alone as out of scope: `RESEND_API_KEY`, `EMAIL_FROM`, `CRON_SECRET` and `BOOKING_EXPIRY_MINUTES` are all missing from `code-standards.md`'s env var table.
