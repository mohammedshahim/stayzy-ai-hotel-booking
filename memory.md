# Memory — Feature 39 Compare Summary

Last updated: 2026-07-21

## What was built

**Feature 39 is complete and verified end-to-end.** An AI paragraph contrasting the 2–4 hotels selected on `/compare`, filling the slot that had sat `hidden` in `CompareTable.tsx:131-134` since the compare feature shipped. Second AI feature; first one that spends money only when the user asks.

`backend/`:
- `models/ai.schema.ts` — added `compareAiSummaries` (uuid id, unique `hotel_ids_hash`, `content_hash`, `summary`, `model_version`, `generated_at`). **No FK to hotels** — the key is a set, nothing to cascade from
- `drizzle/0003_add_compare_ai_summaries.sql` + hand-written `.down.sql` (rollback tested both directions)
- `queries/ai-summaries.queries.ts` — `findCompareSummary` / `upsertCompareSummary`
- `services/ai.service.ts` — `getCompareSummary`, `toComparePayload`, plus two refactors: `generateSummary` → `requestSummary(path, body, timeoutMs)` shared by both AI routes, and a `hashOf(value)` helper
- `controllers/ai.controller.ts` — `getCompareAiSummary`
- `types/compare.schemas.ts` — `compareSummaryQuerySchema` + `MIN_/MAX_COMPARE_SUMMARY_HOTELS`
- `routes/ai.routes.ts` — `GET /ai/hotels/compare-summary?ids=`

**No new env vars.** No new seed command (deliberate — see decisions).

`agent/`: new `chains/summary/compare_summary_chain.py`; `COMPARE_SUMMARY_SYSTEM` / `COMPARE_SUMMARY_HOTEL` added to the existing `prompts.py`; `CompareHotel` / `CompareSummaryRequest` in `schemas/summary.py`; `POST /summary/compare` in `summary_routes.py`. `MAX_TOKENS = 900` (hotel chain uses 600).

`frontend/`: new `hooks/useCompareSummary.ts` and `components/CompareSummarySection.tsx`; `MIN_COMPARE_HOTELS` added beside the existing `MAX_COMPARE_HOTELS` in `CompareProvider.tsx`; `CompareAiSummary` in `types.ts`; hidden div replaced in `CompareTable.tsx`.

**Context files updated:** `progress-tracker.md` (Feature 39 entry, status → Phase 12 / Feature 40), `architecture.md` (corrected cache invariant, schema table, the enumerable-key rule), `ai-phase-plan.md` (shipped + deviations), `ui-registry.md` (AI Compare Card + skeleton recipe), `code-standards.md` (comment recurrence).

## Decisions made

- **Price is excluded from the summary, which replaced the planned TTL with content-hash invalidation.** This is a **deliberate deviation** from `ai-phase-plan.md`, which specified TTL. The TTL existed because a comparison was assumed to mention price, and `fromPrice` moves with rates — hashing it would bust the cache constantly. Drop price and every remaining field is stable, so Feature 38's exact-invalidation mechanism ports over and a staleness window buys nothing. `architecture.md`'s "compare summaries are TTL-based" invariant was corrected. **Nothing in this feature expires on a timer.**
- **Generation is behind a "Compare with AI" button, not automatic on page load** — the one behavioural break from Feature 38. Compare selections are built incrementally (`{A}` → `{A,B}` → `{A,B,C}`), so auto-generating bills for every throwaway intermediate set, and combinations cannot be pre-warmed. Generalised into a rule now in `architecture.md`: **auto-generate when the cache key is enumerable and warmable; require an explicit action when it is not.** Features 43–48 must check which side they fall on rather than assuming Feature 38's default.
- **Deliberately no `seed:compare-summaries`.** Hotels are enumerable; combinations are not.
- **`AI_REQUEST_TIMEOUT_MS` stays at 20s and slow generations are allowed to fail** — developer's explicit call after seeing the measurements. The "Try again" button is the accepted mitigation. **A timed-out generation is paid for and discarded.** Pre-considered fix if it proves noisy: a dedicated `AI_COMPARE_TIMEOUT_MS` at 45s (above the observed ceiling, below the ~60s production proxy cut).
- **A failure shows an inline error + "Try again" rather than hiding the section** — the opposite of Feature 38, and deliberate. Hiding is right on the hotel page where nobody asked; here the user pressed a button and silence reads as a broken button. **Any future AI surface that spends money on an explicit action inherits this pair: a button to start, a visible failure state.**
- **`hotel_ids_hash` is built from the ids that actually resolved, not the ids requested**, so `{A, B, deleted-C}` shares a row with `{A, B}` — the key describes what was really summarised.
- `model_version` recorded but not compared (inherited from Feature 38, unchanged).
- Route bounds are 2–4 ids; 4 mirrors the frontend's `MAX_COMPARE_HOTELS`.

## Problems solved

- **The 20s timeout is a live risk, not hypothetical.** Measured cold latency through the full stack: **18.5s (2 hotels), 19.2s (4 hotels), and one outright timeout at 20.1s.** Also observed ~1.1s when the provider was warm — it is wildly bimodal. Do not assume a generation fits in the budget.
- **A stale `tsx watch` backend from a previous session had stopped picking up file changes** (likely fs-event flakiness on the external SSD). It served the old code and the new route 404'd, while a second `pnpm dev` silently died on `EADDRINUSE` in the background log. **If a new route 404s, check `lsof -ti :4000` for an old process before debugging the route.**
- **A false alarm worth not repeating (second time this project has hit this class of thing):** hash invalidation looked broken because I inspected the row with `ORDER BY generated_at LIMIT 1` — which returns the *oldest* row, and regeneration bumps `generated_at`, so the row I was comparing "before and after" moved position between reads. Invalidation was working. **Query the row by its key, never by ordering on a column the operation mutates.**
- **`backend/src/services/ai.service.ts`'s `buildContentHash` joins with a NUL byte, not a space** — `parts.join("\0")`. It renders identically to `" "` in an editor, so string edits to that line fail to match mysteriously. Feature 38 code, left untouched (out of scope). Harmless and arguably a better separator than a space, but completely invisible — **worth a deliberate look next time anyone edits that function.**
- **The model's upstream provider returned `ResourceExhausted: Worker local total request limit reached (33/32)` (HTTP 502) twice** during verification. Transient free-tier capacity, not our code; resolved on retry. It did confirm the failure path works end to end.
- **eslint `react-hooks/set-state-in-effect`** rejected resetting state in an effect when the selection changes. Fixed by deriving instead — the state carries a `forKey` and anything else reads as idle, the same trick `useCompareHotels` uses for `isLoading`.
- **An `AbortController` was added to `useCompareSummary` and then deliberately reverted** on the developer's push-back. `useCompareHotels` aborts because its fetch runs in an effect that re-fires on `idsKey` change, so a stale response can overwrite a fresh one. `useCompareSummary` has no such race — generation is user-initiated and the `forKey` guard already discards non-matching responses. **Copy a sibling's pattern only after checking the pattern's reason still applies.**

## Current state

Feature 39 complete and verified. `pnpm build` clean (backend), `tsc --noEmit` + `eslint` clean (frontend), `ruff check` + `ruff format --check` clean (agent).

**Nothing is committed** — 18 modified files and 6 new paths on `main`. (Feature 38 *was* committed, in 8 commits `26d9b48` → `699894f`, despite the previous memory file claiming otherwise — that stale claim is what made this file worth rewriting.)

Verified against both real running apps and the real seeded database:
- `agent/`'s route: 401 with no secret, 401 with a wrong secret, real comparison with the right one
- Cold generation 18.5s; immediate reload **0.042s with no LLM call**
- **Reversed order `{B,A}` returned in 0.033s with exactly one row in the table** — the sorted-id key works
- Editing `cancellation_policy` changed `content_hash` (`6541608e78` → `1afc8e6590`) and the served text changed with it; **restoring the original reproduced the original hash exactly**
- With `agent/` stopped: `200 {"summary":null}`, no 500, **no row written**
- 1 id and 5 ids both 400 from zod
- Playwright, **zero console errors**: card renders below the table, button → skeleton → summary, single-hotel selection renders no section
- Refactor safety: after the `hashOf` change the existing cache rows still hit (hash values unchanged)

**Quality check:** the model correctly contrasted five vs four stars, gym/spa vs neither, and both cancellation policies; said "no guest reviews" for two hotels with `review_count = 0`; and **never mentioned price** despite $145 and $320 being visible in the table above.

**`/review` and `/imprint` both caught real things.** `/review`: the feature shipped over-commented for the **second feature running** (19 comment lines → 6, on the developer's second correction — the rule is in `code-standards.md` → Comments and now records the recurrence), and the number `2` was encoded in three independent places including a dead export. `/imprint`: the button used `bg-surface` where the locked Secondary Button specifies `bg-elevated` — invisible today since both are `#ffffff` and there is no dark theme, fixed precisely for that reason.

**Environment notes:** no credential values recorded anywhere. Services left running: `backend/` :4000, `agent/` :4100, `frontend/` :3000 (all started or restarted this session). `compare_ai_summaries` holds 4 legitimate cached rows from verification — real cache data, not test pollution. The hotel edited during hash testing was restored and verified; no test data left behind.

## Next session starts with

1. **Decide whether to commit Feature 39.** All uncommitted on `main`. A sensible split mirroring Feature 38's: (a) schema + migration, (b) backend service/route/schema, (c) agent chain + route, (d) frontend hook + section, (e) context/doc updates.
2. Then **Feature 40 — Query extraction chain.** Read `ai-phase-plan.md`. NL prompt → the exact structured filters already defined in `backend/src/types/search.schemas.ts:13-41`, current-date-aware so relative dates ("next weekend") resolve. **No UI — that is Feature 41.**

What Feature 40 inherits and must not rebuild:

- `services/ai.service.ts`, `controllers/ai.controller.ts`, `routes/ai.routes.ts` exist and are mounted at `/ai`. **`requestSummary(path, body, timeoutMs)` is the shared `agent/` caller** — timeout, error handling and the empty-content check live there once.
- `aiRateLimit` is mounted on the whole `/ai` router, so a new route is covered automatically.
- `agent/src/chains/summary/` now holds two chains; either is the shape to copy. `agent/src/api/deps.py` guards every `agent/` route.
- **Any new chain needs `max_tokens` headroom** — too low returns *empty* content, not short content, because the model reasons first. Treat empty as failure.

## Open questions

- **The NUL-byte separator in `buildContentHash`** (see Problems solved). Not a bug; invisible. Decide whether to make it explicit or leave it.
- **Whether 20s proves too tight in real use.** The fix is pre-designed (`AI_COMPARE_TIMEOUT_MS` at 45s) if timeouts become noticeable.
- **`backend/.env` declares `INTERNAL_SERVICE_SECRET` twice** (lines 28 and 40). Same value in both, so nothing is broken, but the later line silently wins and rotating only one would break internal calls confusingly. Flagged across two sessions now, still untouched. Worth deleting one.
- **A published hotel literally named "test room"** has generated summaries, as do the "Temp User 1" bookings against Hotel Marais Charme (~2026-07-13). Both leftover test data, both still awaiting a decision, and **both will pollute chatbot evals in Features 45–46 and 51. Worth clearing before Feature 45.**
- Both model slots still point at the same free Nemotron model ("later will update"). The fast/smart split exists in config, so raising the chatbot's model needs no call-site change.
- The compare-tray `sm:w-fit` change from an earlier session remains an interpretation, not a confirmed diagnosis — one class to revert if it looks wrong.
- The Feature 16 rating-consistency question — carried across many sessions, mostly moot since Feature 24, never re-verified.
- Whether to retrofit the fetch-error-state pattern onto `HotelsListPage` and other existing admin lists — not blocking, flagged in `ui-registry.md`.
- Hosting provider still undecided; not blocking since deployment moved to Phase 16. **`trust proxy` must be settled as part of that decision or the IP-keyed AI rate limiter is effectively disabled in production.**

## Note on secrets

No credential values are recorded in this file. `OPENROUTER_API_KEY` and `INTERNAL_SERVICE_SECRET` live only in `agent/.env` and `backend/.env` (both gitignored) and were never printed in full this session. All `.env.example` templates are tracked and contain placeholders only.
