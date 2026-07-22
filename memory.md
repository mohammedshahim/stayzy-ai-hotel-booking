# Memory — Feature 40 Query Extraction Chain

Last updated: 2026-07-22

## What was built

**Feature 40 is complete and verified end-to-end.** A natural-language prompt becomes the structured filters `searchQuerySchema` already defines, plus the phrases that became no filter at all. Third AI feature, and the **first with no cache, no table and no migration**. No UI — that is Feature 41.

`backend/`:
- `types/search-extraction.schemas.ts` (new) — `searchExtractionBodySchema` (prompt, capped at `MAX_EXTRACTION_PROMPT_LENGTH = 500`), the all-optional `extractedFiltersSchema`, `agentExtractionSchema`
- `services/search-extraction.service.ts` (new) — loads the three taxonomies, calls `agent/`, resolves names → uuids, drops misparsed date/price pairs
- `extractSearchQuery` in `ai.controller.ts`; `POST /ai/search/extract` in `ai.routes.ts`
- Two refactors: `postToAgent<T>(path, body, timeoutMs)` split out of `requestSummary` in `ai.service.ts` (exported; the generic fetch + envelope-unwrap half, now shared by both features), and `SEARCH_SORT_OPTIONS` exported from `search.schemas.ts` instead of the sort list living inline in the zod enum

**No new env vars, no migration, no seed command, no new dependencies.**

`agent/`: new `chains/smart_search/` (`query_extraction_chain.py`, `prompts.py`, `__init__.py`), `schemas/smart_search.py`, `api/smart_search_routes.py` mounting `POST /smart-search/extract`, mounted in `api/router.py`. `MAX_TOKENS = 1200`, `temperature=0`.

**Context files updated:** `progress-tracker.md` (Feature 40 entry, status → 41, two new inherited rules, and **Feature 39's checkbox which last session left unticked**), `architecture.md` (smart-search flow, three invariants, no-cache rationale), `ai-phase-plan.md` (shipped + three things the sketch missed), `library-docs.md`, `code-standards.md`, `project-overview.md`. `CLAUDE.md` also changed — see Problems solved.

## Decisions made

- **The model never sees or emits a uuid.** `searchQuerySchema` takes uuid arrays for `amenities`/`roomFeatures`/`mealPlans`. `backend/` reads those three tables, sends the **names** as a closed vocabulary, and maps the reply back to ids. Rejected: fuzzy-matching free text (silently mismatches "spa" vs "Spa & Wellness") and letting `agent/` fetch the taxonomy (business-data lookup in the wrong service, extra hop). **Features 45–46's tools face the same problem and should copy `search-extraction.service.ts` rather than trusting a model with a key.**
- **The output is a partial of `searchQuerySchema`, never a defaulted `SearchQuery`.** An absent field means the prompt did not mention it. Running it through `searchQuerySchema` would fill in `adults: 2`, `sort: "recommended"` etc. and Feature 41's editable chips could no longer tell an inferred filter from a schema default. **This is the whole reason the chips can be honest — do not "normalise" the output later.**
- **No cache table, deliberately** — the enumerable-key rule from Feature 39 pointing the other way. A free-text prompt cannot be enumerated, cannot be warmed by a seed command, and repeats too rarely to earn a table. `aiRateLimit` on the `/ai` router is the only ceiling. Recorded in `architecture.md` and `library-docs.md` **specifically so nobody "fixes" the inconsistency with Features 38–39 later.**
- **Unmatched terms are returned in `unmapped`, not dropped** — including a taxonomy name the model invented rather than copying from the vocabulary. Feature 41 shows what was ignored; **Feature 42 consumes this same list directly** ("near the Eiffel Tower" is exactly its input).
- **A misparsed date or price pair is dropped, not fatal.** Past date, `checkOut <= checkIn`, or `minPrice > maxPrice` clears just that pair. One bad field must not discard a good prompt.
- **`sort: "distance"` is withheld** from the vocabulary offered to the model — it orders by an anchor point only Feature 42 supplies.
- **Prompt-and-parse, not `with_structured_output`.** Ask for bare JSON, regex the outermost `{...}` (`re.compile(r"\{.*\}", re.DOTALL)`), validate with pydantic, return `None` on any failure → route raises 502 → `postToAgent` returns null. Reasons: free-tier OpenRouter tool-calling/JSON-mode support is not guaranteed, and a reasoning model wraps its answer in a fence or a sentence even when told not to. **A half-parsed object is never returned.** Now written up in `library-docs.md`.
- **`agent/` reads no clock** — `backend/` passes today's date on every call, so replaying a prompt extracts the same dates.

## Problems solved

- **Over-commenting was corrected for the third feature running, and the developer escalated it.** The rule existed in `code-standards.md` and as the tail clause of one dense paragraph in `CLAUDE.md` — which is exactly why it kept getting skimmed past. Fixed by promoting it to its own prominent **`## Do not comment the code`** section near the top of `CLAUDE.md`, and by saving it to the persistent project memory directory (`no-long-comments.md` + `MEMORY.md` index) so it loads every session independent of the repo. Feature 40's code was then cut from 9 comments (several 2–3 lines) to 5 single-line ones. **The default is zero comments; rationale belongs in `context/`, never in the code.**
- **A real bug I wrote and caught: spreading `{}` does not remove keys.** `{...filters, ...pickDates(...)}` where `pickDates` returned `{}` on invalid input left the bad dates in place. The guards must return `{ checkIn: undefined, checkOut: undefined }` explicitly — `undefined` values vanish from `JSON.stringify`, `{}` does not overwrite. Same for `pickPrices`. **This is what the one surviving comment on `pickDates` records.**
- **The stale-backend trap from last session recurred and was avoided.** Port 4000 held a process from a previous session. Killed and restarted before testing rather than debugging a phantom 404. **Check `lsof -ti :4000` first, always.**
- **`agent/` must be started from `agent/`, not from `backend/`.** A `cd backend && ... & nohup uv run python -m src.main &` chain ran the agent in `backend/`'s directory, so pydantic-settings read `backend/.env` and the app refused to boot naming `backend_internal_url` / `openrouter_api_key` as missing. Not a code bug.
- **The 20s timeout is a live risk again, and worse here than in Feature 39.** Measured 6–14.5s per extraction, with one prompt hitting `AI_REQUEST_TIMEOUT_MS` outright. **Unlike Features 38–39 there is no cache to hide behind — every smart search pays full generation cost, every time.**
- **The upstream free-tier 502 recurred repeatedly** — `ResourceExhausted: Worker local total request limit reached (32/32)`, ~6 times during verification. Transient, resolves on retry, same as Feature 39. Verification scripts needed a retry loop. **A retry affordance in Feature 41 is not optional.**
- **The prompt was corrected to match the model, not the reverse.** The prompt asserted `"highly rated" is minGuestRating`; the model instead put the phrase in `unmapped` rather than inventing a numeric threshold. The model's behaviour is better — guessing `minGuestRating: 8` from a vague phrase is a fabricated filter — so the prompt line was softened.
- **ruff E501 caps lines at 100 including inside prompt strings.** Long prompt lines need a trailing `\` continuation.

## Current state

Feature 40 complete and verified. `pnpm build` clean (backend), `ruff check` + `ruff format --check` clean (agent), `tsc --noEmit` clean (frontend, untouched).

**Nothing is committed** — 5 modified backend/agent files, 5 new paths, 6 modified context files, plus `CLAUDE.md`, all on `main`. A sensible split mirroring Feature 39's: (a) backend types + `postToAgent` refactor, (b) backend route/controller/service, (c) agent chain + route, (d) context/doc updates + `CLAUDE.md`.

Verified against both real running apps and the real seeded database:
- `agent/`'s route: 401 with no secret, 401 with a wrong secret
- "5 star hotel in Paris with a spa and a pool for 2 adults next weekend, under 300 a night" → Paris, `starRatings [5]`, `adults 2`, `maxPrice 300`, real Spa + Swimming Pool uuids, concrete future dates, **and no defaulted fields**
- A family prompt split `adults 2` / `kids 3` and resolved Breakfast Included + `freeCancellationOnly`
- "jacuzzi, helipad and rooftop cinema" (none exist) → `destination: Rome` with all three in `unmapped`, no invented amenities
- "a romantic quiet place near the Eiffel Tower with a balcony" → resolved Balcony, left `destination` **out** (a landmark is not a city), all three phrases in `unmapped`
- Gibberish → `{}` filters
- **Dates in 2020 dropped while `destination: Lisbon` survived** — the pair guard works
- One prompt naming all three vocabularies resolved Free Wi-Fi + Parking, Sea View and Half Board together
- Validation: empty prompt, missing key, 501 chars → all 400
- With `agent/` stopped: `200 {"data":null}`, no 500
- The `/ai` limiter is inherited by the new route (`RateLimit-Limit: 20` in the response headers)

**Environment notes:** no credential values recorded anywhere. Services left running: `backend/` :4000, `agent/` :4100. `frontend/` was **not** started this session (no UI work). No new rows written anywhere — this feature has no table. No test data created or left behind.

## Next session starts with

1. **Decide whether to commit Feature 40.** All uncommitted on `main`.
2. Then **Feature 41 — Smart search UI.** Read `ai-phase-plan.md`. Build the natural-language box in `FilterSidebar.tsx`; inferred filters render as **editable** chips so a bad extraction is correctable, not a dead end.

What Feature 41 inherits and must not rebuild:

- `POST /ai/search/extract` returns `{ filters, unmapped }`. `filters` is a **partial** of `searchQuerySchema` — an absent key means the prompt never mentioned it, which is what makes the chips honest. `unmapped` is the list of phrases that became no filter and **should be shown, not swallowed**.
- **Design around the latency and the absence of a cache**: 6–14.5s is normal, the 20s timeout is reachable, and every search pays it. A visible in-flight state and a retry affordance are both **required**. The pre-designed fix if 20s proves too tight is a dedicated timeout override (~45s), below the ~60s production proxy cut.
- `ui-registry.md`'s standing sparkle-icon rule (`SparklesIcon h-4 w-4 text-accent-text` marks AI-generated content) enumerates Features 39, 44, 48 and **omits 41** — the smart search box should almost certainly use it, and the rule should be updated to say so.
- There is **no "Smart Search Box" spec in `ui-rules.md`** — Feature 41 writes it from scratch, then runs `/imprint`.

## Open questions

- **Whether 20s proves too tight.** More pressing than it was for compare, because there is no cache. Fix is pre-designed.
- **Three stale doc lines found this session but deliberately not fixed** (pre-existing, outside Feature 40's scope): `ui-rules.md:266` and `project-overview.md:100` and `:118` still describe the Feature 38/39 AI slots as "not built". Worth a quick cleanup pass.
- **`backend/.env` declares `INTERNAL_SERVICE_SECRET` twice** (lines 28 and 40). Same value, so nothing is broken, but the later line silently wins and rotating only one would break internal calls confusingly. Flagged across three sessions now, still untouched.
- **The NUL-byte separator in `buildContentHash`** — `parts.join("\0")` renders identically to a space, so string edits to that line fail to match mysteriously. Feature 38 code, harmless, invisible. Decide whether to make it explicit.
- **A published hotel literally named "test room"** has generated summaries, as do the "Temp User 1" bookings against Hotel Marais Charme (~2026-07-13). Both leftover test data, both awaiting a decision, and **both will pollute chatbot evals in Features 45–46 and 51. Worth clearing before Feature 45.**
- Both model slots still point at the same free Nemotron model. The fast/smart split exists in config, so raising the chatbot's model needs no call-site change.
- The compare-tray `sm:w-fit` change from an earlier session remains an interpretation, not a confirmed diagnosis.
- The Feature 16 rating-consistency question — carried across many sessions, mostly moot since Feature 24, never re-verified.
- Whether to retrofit the fetch-error-state pattern onto `HotelsListPage` and other existing admin lists — flagged in `ui-registry.md`.
- Hosting provider still undecided; not blocking since deployment moved to Phase 16. **`trust proxy` must be settled as part of that decision or the IP-keyed AI rate limiter is effectively disabled in production.**

## Note on secrets

No credential values are recorded in this file. `OPENROUTER_API_KEY` and `INTERNAL_SERVICE_SECRET` live only in `agent/.env` and `backend/.env` (both gitignored). A pydantic boot error did echo a truncated fragment of a `backend/.env` value to a log during the misdirected-launch incident above; that log is in the job temp directory, not the repo, and the fragment is not reproduced here. All `.env.example` templates are tracked and contain placeholders only.
