# Memory — Feature 38 Hotel Detail Summary

Last updated: 2026-07-20

## What was built

**Feature 38 is complete and verified end-to-end.** The first feature in the project that spends real money, and the first time `backend/` ever calls `agent/`. A short AI-written paragraph now renders on `/hotels/[id]` in an "At a glance" card between the hotel description and Amenities.

`backend/` — new files:

- `models/ai.schema.ts` — `hotel_ai_summaries` (uuid id, unique `hotel_id` FK cascade, `content_hash`, `summary`, `model_version`, `generated_at`)
- `drizzle/0002_add_hotel_ai_summaries.sql` + hand-written `.down.sql` (rollback tested in both directions)
- `queries/ai-summaries.queries.ts` — find + upsert (`onConflictDoUpdate`)
- `services/ai.service.ts` — hash, cache check, `fetch` to `agent/` with `AbortSignal.timeout`, upsert
- `controllers/ai.controller.ts`, `routes/ai.routes.ts` — `GET /ai/hotels/:id/summary`, mounted at `/ai`
- `config/seed-ai-summaries.ts` — new `pnpm seed:ai-summaries`, takes `--force`

Modified: `middlewares/rateLimit.ts` (added `aiRateLimit`), `config/env.ts`, `config/db.ts`, `routes/index.ts`, `.env.example`, `package.json`. New env: `AGENT_BASE_URL`, `AI_RATE_LIMIT_WINDOW_MS`, `AI_RATE_LIMIT_MAX`, `AI_REQUEST_TIMEOUT_MS`, `AI_SEED_TIMEOUT_MS`.

`agent/` — new: `api/deps.py` (`require_internal_service` + `ActingUser` alias — the Python mirror of `requireInternalService.ts`), `api/summary_routes.py`, `chains/summary/hotel_summary_chain.py` + `prompts.py`, `schemas/summary.py`. Modified `api/router.py`.

`frontend/` — new: `hooks/useHotelSummary.ts`, `components/HotelSummarySection.tsx`; wired into `HotelDetailsContent.tsx` under the description. The slot genuinely did not exist — the 2026-07-19 audit was correct.

**Context files updated:** `progress-tracker.md` (Feature 38 entry, status moved to 39, OpenRouter section rewritten), `architecture.md` (6 new invariants, schema table, AI flow), `code-standards.md` (env table), `library-docs.md` (reasoning-model rules under OpenRouter), `ui-registry.md` (two entries), `ai-phase-plan.md` (Feature 38 marked shipped, audit row corrected).

## Decisions made

- **The summary route is public**, matching the hotel page it renders on. That forced `aiRateLimit` to key on **IP**, the deliberate opposite of `internalRateLimit`'s acting-user key — a public route has no user to key on, and unlike internal traffic these are real browsers from many addresses. Now an invariant in `architecture.md`.
- **`trust proxy` is deliberately NOT set — it is a Phase 16 task.** Behind a production load balancer, IP keying collapses every visitor into one bucket. Setting it without knowing the topology is worse: `X-Forwarded-For` becomes forgeable and the limiter fully bypassable.
- **The cache, not the limiter, is the real spend bound.** One hotel generates once per content change regardless of traffic; the limiter only stops someone spraying many distinct hotel ids. Hence a generous 20/min.
- **Generation stays synchronous at 20s, paired with a pre-generate command.** The developer asked for a 300s timeout because free models are slow; this was pushed back on — a 5-minute browser request gets abandoned, and a cancelled request throws the generation away *uncached* (you pay and store nothing), and production proxies cut it to ~60s anyway. Resolution: the long budget lives where nothing waits (`AI_SEED_TIMEOUT_MS` 300s for the CLI), the short one in the request path (`AI_REQUEST_TIMEOUT_MS` 20s).
- **Only the hashed fields are sent to the model.** The hash spans name, description, city, country, star rating, sorted amenity names, average rating, review count — **wider than the plan's original four fields**, because the prompt legitimately uses location and star rating. A field the model sees but the hash ignores would pin a stale summary forever.
- **Deviation from the `/architect` plan: `model_version` is recorded but NOT part of the cache check.** Comparing it would force `backend/` to know `agent/`'s configured model, duplicating config across the service boundary. A model or prompt change ships via `pnpm seed:ai-summaries --force`. **Feature 39 should follow this, not reinvent it.**
- **A failure hides the section**, matching `SimilarHotelsSection`'s return-`null` habit; failures are never cached so the next visit retries. An empty model response counts as a failure.
- **The sparkle icon is the standing AI-content marker** (confirmed during `/imprint`). It is the only icon in any section heading in the app — a deliberate exception. **Features 39, 44, 48 must reuse `SparklesIcon h-4 w-4 text-accent-text`** rather than inventing their own, or it stops being a signal.

## Problems solved

- **The configured model reasons before answering, and a low `max_tokens` returns EMPTY content, not short content.** The first smoke test with `max_tokens=20` came back as pure chain-of-thought with no answer. With adequate budget, OpenRouter splits it: `reasoning` field holds the thinking, `content` holds the clean answer. `MAX_TOKENS = 600` in the chain because ~100 tokens go to thinking before a word is written. Any new chain needs the same headroom, and any caller must treat empty content as failure. Recorded in `library-docs.md`.
- **A false alarm worth not repeating: hash invalidation appeared broken** — reverting content did not regenerate. The cause was **my own rate limiter** (20/min) silently 429ing requests that were piped to `/dev/null`. With a fresh window, identical content reproduced the identical hash. Always check the status code when a cached-route test behaves oddly.
- **Latency is high and variable** — 4.2s calling `agent/` directly vs 13.8s through the full stack for the same prompt. Assume 4–15s. This is what makes the warm-cache command load-bearing rather than a nicety.
- The model slug `nvidia/nemotron-3-ultra-550b-a55b:free` was confirmed present in OpenRouter's catalog (`GET /api/v1/models`) before any build work — worth doing first for any new slug, since a bad one only fails at the first real call.
- Playwright is not installed in any app but **is** in the npx cache with Chromium available. ESM cannot resolve it via `NODE_PATH`; import the CommonJS entry by absolute path and destructure (`import pkg from '<path>/playwright/index.js'; const { chromium } = pkg;`).

## Current state

Feature 38 complete and verified. `pnpm build` clean (backend), `tsc --noEmit` + `eslint` clean (frontend), `ruff check` + `ruff format --check` clean (agent).

**Nothing is committed** — everything sits in the working tree on `main`: ~17 modified files and 15 new paths. The developer asked for it to stay that way for review, and explicitly asked not to use worktrees.

Verified against both real running apps and the real seeded database, not by reading code:

- `agent/`'s route: 401 with no secret, 401 with a wrong secret, real summary with the right one (4.2s)
- Through `backend/`: cache miss generated in 13.8s; immediate reload returned identical text in **0.09s with no LLM call**
- Editing a hotel description changed `content_hash` and regenerated; bumping `review_count`/`average_rating` (the columns `review.service.ts` recomputes on every review write) also regenerated
- **Restoring the original content reproduced the original hash exactly** — the hash is deterministic
- With `agent/` stopped: `200 {"summary":null}`, no 500, **no row written**; recovered on the next request once back up
- `pnpm seed:ai-summaries` generated 5 and skipped 1 already-current; re-run was a 1.2s no-op with zero LLM calls
- Limiter's first 429 at exactly request #21 against a limit of 20
- Playwright pass, **zero console errors**: card renders between description and Amenities with the disclaimer line
- All 6 published hotels now have cached summaries

**Quality check:** the model did not hallucinate. "Steps from the Seine" is verbatim in the seeded description; Bar/Restaurant/Free Wi-Fi are that hotel's real amenities. With `review_count = 0` it correctly said nothing about guest ratings — an explicit prompt rule.

**`/imprint` caught and fixed** a real drift: the card used `mt-3` between heading and body where all five sibling section cards use `mt-4`. Fixed and re-verified in the browser. A new **Section Card** entry was added to `ui-registry.md` recording the shared shell that had been copied five times without ever being written down.

**Environment/config notes:** the OpenRouter key is live and working (value never recorded anywhere). `.claude/settings.local.json` gained `"worktree": {"bgIsolation": "none"}` so background jobs edit the checkout directly instead of being forced into a worktree — the developer's explicit instruction. That file is ignored via the user's global gitignore.

Services left running: `agent/` on :4100 and `frontend/` on :3000 (both started this session); `backend/` on :4000 was already up from before.

## Next session starts with

1. **Decide whether to commit Feature 38.** It is all uncommitted on `main`. A sensible split: (a) migration + schema, (b) backend service/route/limiter/env, (c) agent deps + chain + route, (d) frontend section + hook, (e) context/doc updates.
2. Then **Feature 39 — Compare summary.** Read `ai-phase-plan.md`. Chain + `compare_ai_summaries` + hand-written `.down.sql`; unhide and wire the existing slot at `CompareTable.tsx:131-134`.

What Feature 39 inherits and must not rebuild:

- `services/ai.service.ts`, `controllers/ai.controller.ts`, `routes/ai.routes.ts` exist and are mounted at `/ai`. Add to them; do not create a parallel set.
- `aiRateLimit` is mounted on the **whole** `/ai` router, so a new route there is covered automatically.
- `agent/src/api/deps.py` exists; `agent/src/chains/summary/` is the shape to copy for a new chain.
- **Feature 39's cache is TTL-based, not hash-based** — this is the one real difference from 38.
- Do **not** blindly copy `seed:ai-summaries`. Hotels are enumerable; `compare_ai_summaries` is keyed on a *combination* of hotels, so the key space is not.

## Open questions

- **`backend/.env` declares `INTERNAL_SERVICE_SECRET` twice** (lines 28 and 40). Both currently hold the same value and it matches `agent/.env`, so nothing is broken — but the later line silently wins, so rotating only one would break internal calls confusingly. Flagged, not touched. Worth deleting one.
- **A published hotel literally named "test room"** now has a generated summary. Leftover test data, same family as the long-flagged "Temp User 1" bookings against Hotel Marais Charme (~2026-07-13). Both still awaiting a decision, and both will pollute chatbot evals in Features 45–46 and 51. Worth clearing before Feature 45.
- Both model slots are still the same free Nemotron model ("later will update"). The fast/smart split exists in config, so raising the chatbot's model needs no call-site change.
- The compare-tray `sm:w-fit` change from an earlier session remains an interpretation, not a confirmed diagnosis — one class to revert if it looks wrong.
- The Feature 16 rating-consistency question — carried over many sessions, mostly moot since Feature 24, never re-verified.
- Whether to retrofit the fetch-error-state pattern onto `HotelsListPage` and other existing admin lists — not blocking, flagged in `ui-registry.md`.
- Hosting provider still undecided; not blocking since deployment moved to Phase 16. Note that **`trust proxy` must be settled as part of that decision** or the AI rate limiter is effectively disabled in production.

## Note on secrets

No credential values are recorded in this file. The OpenRouter API key is real and working but lives only in `agent/.env` (gitignored) and was never printed in full during this session. `INTERNAL_SERVICE_SECRET` exists in both `backend/.env` and `agent/.env` (both gitignored) and the effective values were confirmed to match. All `.env.example` templates are tracked and contain placeholders only.
