# Memory — Feature 37 Internal Auth Passthrough + Rate Limiting (+ comment discipline standard)

Last updated: 2026-07-20

## What was built

**Feature 37 is complete and verified.** The trust boundary between `agent/` and `backend/` is live, and the per-user rate-limiting mechanism exists. All changes are in `backend/` — **no `agent/` code was written**, because `backend_client.py` already sent both headers from Feature 36.

New files:

- `src/middlewares/requireInternalService.ts` — constant-time secret compare lifted from `requireCronSecret.ts`; sets `req.actingUserId`
- `src/middlewares/rateLimit.ts` — one configured `express-rate-limit` instance, keyed on the acting user
- `src/controllers/internal/bookings.controller.ts` + `src/routes/internal/bookings.routes.ts` — `GET /internal/bookings`, the first `internal/*` route, a thin wrapper over the existing `listBookingsForOwner`

Modified: `src/config/env.ts` (required `INTERNAL_SERVICE_SECRET` + two rate-limit knobs), `src/types/express.d.ts` (`actingUserId`), `src/routes/index.ts` (mount), `.env.example`, `package.json`/`pnpm-lock.yaml`.

New dependency: **`express-rate-limit` 8.6.0** — the first added to `backend/` in a while. Its installed `.d.ts` was read before use per `library-docs.md`'s standing rule, and it now has its own section there.

**Context files updated:** `progress-tracker.md` (Feature 37 entry, status moved to 38, second standing-rule block), `architecture.md` (invariant corrected + new invariant + middleware tree), `code-standards.md` (Comments section rewritten, Engineering Mindset bullet, env table), `library-docs.md` (`express-rate-limit` section), `ai-phase-plan.md` (two corrections), `CLAUDE.md` (third standing rule).

## Decisions made

- **The first `internal/*` route is `GET /internal/bookings`, chosen because it is user-scoped.** A hotel route would have been a smaller wrapper but a worthless test — hotel data is identical regardless of who asks, so swapping the acting-user header would prove nothing. Feature 46 needs the route anyway.
- **The rate limiter's `internal/*` mount is defence in depth, NOT the cost ceiling.** This surfaced during `/architect` and changes what Feature 38 must do. `internal/*` is `agent/`→`backend/` and costs nothing; worse, limiting it throttles the expensive-but-legitimate chatbot turn (five tool calls) while a summary generation (zero internal calls, real money) passes unbounded. **The mount that caps OpenRouter spend goes on the inbound AI route and lands with Feature 38.** Now an invariant in `architecture.md`.
- **Secret always required, `x-acting-user-id` optional.** Feature 38's summary generation is hotel-scoped and has no user to name. Routes needing a user check `req.actingUserId` themselves and 400. This corrected an `architecture.md` invariant that claimed every internal call carries an acting user id.
- **`INTERNAL_SERVICE_SECRET` is required in `env.ts` with no default**, unlike `CRON_SECRET`. `backend/` now refuses to boot without it — the alternative fails closed but silently, giving internal routes that 401 forever in production.
- **`agent/src/api/deps.py` deferred to Feature 38**, correcting the tracker's earlier claim it belonged in 37. Nothing calls `agent/` until Feature 38 creates the first inbound route.
- **`express-rate-limit` over a hand-rolled counter** — same configuration effort, but stale-key eviction and `RateLimit-*` headers come free. In-memory, so counters reset on restart and don't span instances; a `store:` option at Phase 16, not a rewrite.
- **Comments are the exception, not the habit — now a standing rule for all four apps, every remaining feature** (developer's instruction, late in the session). The rule already existed at `code-standards.md` → Comments and simply was not followed; it was tightened with three concrete tests rather than reinvented, and promoted to the top of `CLAUDE.md` so it is in context every session.

## Problems solved

- **Nothing genuinely hard this session.** Worth knowing: the first two verification curls returned HTTP 000 and looked exactly like a hang — it was `tsx watch` mid-reload after the edits, not a defect. The same request measured 10ms once the reload settled. Do not debug this as a code problem.
- A mid-verification `BackendError: ... -> 429` was not a bug either — the 60s window from the hammer test was still open. Waiting it out was the fix.
- **Feature 37 shipped over-commented and was corrected the same day**: ~30 comment lines down to 6. `rateLimit.ts` had an 11-line docstring restating design rationale already written in `progress-tracker.md` and `library-docs.md`. The lesson recorded in `code-standards.md`: anything needing a paragraph is design rationale and belongs in `context/`, never in code — the copy in the code is the one nobody updates.

## Current state

Feature 37 complete and verified. `pnpm build` clean. **Nothing is committed** — 12 modified files plus 4 untracked paths in the working tree.

Verified against both real running apps and the real seeded database, not by reading code:

- Valid secret + acting user → `200` with real bookings
- Wrong secret → 401; absent secret → 401; valid secret with no acting user → 400
- **Passthrough (the load-bearing test): user A returned 18 bookings, user B returned 9, matching `select user_id, count(*) from bookings` exactly** — this is what proves the acting-user header actually scopes data rather than the secret alone opening everything
- Limiter: `RateLimit-Policy: 120;w=60` on responses; hammering one user 130× tripped **the first 429 at request #121**, body `{"success":false,"error":"Rate limit exceeded"}`; **the second user still got 200 at that same moment**, proving per-user keying rather than one global bucket
- Through the real client: `backend_client.get("/internal/bookings", user_id=…)` from `agent/`'s venv returned 18 and 9 unwrapped lists, and raised `BackendError` on both the 400 and the 401
- Public `/amenities` still 200 — no regression
- All of the above re-run after the comment trim, returning identically

**Not verified: anything involving OpenRouter** — unchanged from Feature 36. Feature 37 makes no LLM calls. The API key is still a placeholder and the model slug is still unvalidated against OpenRouter's catalog.

Backend dev server was left running on :4000. The agent service was not left running (verification used its venv directly, not the HTTP service).

## Next session starts with

1. **Commit this session's work** — nothing is committed. Suggested split of four: (a) middleware + internal route, (b) `express-rate-limit` dependency + env changes, (c) the comment-discipline rule across `code-standards.md`/`CLAUDE.md` — worth its own commit since it outlives this feature, (d) remaining context updates.
2. Then **Feature 38 — Hotel detail summary**. Read `ai-phase-plan.md`, not `build-plan.md`. Chain + `hotel_ai_summaries` table + hand-written `.down.sql` sibling, and **build the slot** in `HotelDetailsContent.tsx` — it does not exist, despite `project-overview.md` having claimed it was reserved.

Three things Feature 38 inherits and must not rebuild or forget:

- `GET /internal/bookings` is the working reference for any new `internal/*` route: mount `requireInternalService` then `internalRateLimit`, **in that order** (reversed, the limiter keys every request to the fallback bucket).
- **Feature 38 must attach a limiter to the inbound AI route it creates.** This is the mount that bounds OpenRouter billing, and Feature 38 is where unbounded spend starts if skipped. Give it its own tighter window/max env pair rather than reusing the internal one.
- Feature 38 also builds `agent/src/api/deps.py` (the FastAPI mirror of `requireInternalService.ts`) and adds `AGENT_BASE_URL`, since it creates the first inbound `agent/` route.

## Open questions

- **A real OpenRouter API key is now HARD-BLOCKING.** Fine through Feature 37, which made no LLM calls. Feature 38 cannot be completed without one. `agent/.env` holds a placeholder.
- **Both model slots are set to `nvidia/nemotron-3-ultra-550b-a55b:free`** (developer's call, "for now later will update"). The slug is still unverified against OpenRouter's catalog — Feature 38 is the first real call, so expect this to be where a bad slug surfaces.
- **Leftover "Temp User 1" test data in the dev DB** (bookings against Hotel Marais Charme, ~2026-07-13) — flagged since Feature 26, still not deleted, still awaiting a decision. Will pollute any chatbot eval reading real bookings (Features 45–46, 51). Worth clearing before Feature 45.
- The compare-tray `sm:w-fit` change from an earlier session remains an interpretation, not a confirmed diagnosis — one class to revert if it looks wrong.
- The Feature 16 rating-consistency question — carried over many sessions, mostly moot since Feature 24, never re-verified.
- Whether to retrofit the fetch-error-state pattern onto `HotelsListPage` and other existing admin lists — not blocking, flagged in `ui-registry.md`.
- Hosting provider still undecided; not blocking since deployment moved to Phase 16.

## Note on secrets

No credential values are recorded in this file. `INTERNAL_SERVICE_SECRET` now exists in both `backend/.env` and `agent/.env` (both gitignored) and the two were confirmed byte-identical. `OPENROUTER_API_KEY` is a placeholder. Both `.env.example` templates are tracked and contain placeholders only — `backend/.env.example` deliberately leaves `INTERNAL_SERVICE_SECRET=` bare so a missing value fails loudly at boot.
