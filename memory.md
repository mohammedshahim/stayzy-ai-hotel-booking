# Memory — Feature 41 shipped, Feature 42 architected (not built)

Last updated: 2026-07-23

## What was built

**No new code this session.** Feature 41 Smart Search UI had been fully built and verified in the *previous* session but was left uncommitted in the working tree. This session verified it still builds, committed it, and then ran `/architect` for Feature 42 up to the point of needing developer confirmation.

Feature 41's files (written last session, committed this one):
- `frontend/features/search/components/SmartSearchBox.tsx`, `hooks/useSmartSearch.ts`, `lib/extraction.ts` (all new)
- `frontend/features/search/types.ts` — gained `ExtractedSearchFilters` / `SearchFilterExtraction`
- `FilterSidebar.tsx` — new `onSmartSearch` prop; `SearchPageContent.tsx` — wires it to `update(partial, { history: "push" })`
- `backend/src/config/env.ts` + `.env.example` — `AI_REQUEST_TIMEOUT_MS` 20s → 45s
- Six `context/` files updated

**Committed as three commits, not one** (see Decisions):
- `cfa1097` chore(backend): raise AI_REQUEST_TIMEOUT_MS from 20s to 45s
- `366e57d` feat(frontend): add the smart search box to the search sidebar
- `6a899ff` docs(context): log Feature 41 and record its two UI deviations

Working tree is clean. `origin/main` is still at `b2ec04b` — **all three commits are local and unpushed.**

## Decisions made

- **One commit per concern, never one commit per feature.** The developer corrected a squashed Feature 41 commit mid-session. Split along app/concern lines — backend, frontend, `docs(context)` — matching the rhythm already in the log across Features 39–40. Stage by path; do not `git add -A` a whole feature. Also saved to Claude's cross-session memory.
- Feature 41's own decisions (merge-not-stage, no clear-all, global rather than per-call timeout) are already written up in `context/progress-tracker.md`'s Completed Features entry — not duplicated here.

## Problems solved

- Nothing broke this session. `npx tsc --noEmit` (frontend), `pnpm lint` (frontend) and `pnpm build` (backend) were all clean before committing.
- **The squashed-commit mistake and its recovery:** because the commit was still local (`origin/main` was behind), `git reset --soft` to the last pushed commit and re-committing in pieces was safe. Check `git log origin/main -1` before assuming a commit can be rewritten.

## Current state

- **Features 36–41 are complete.** Phase 12 Smart Search is 2 of 3 done.
- **Feature 42 Nearby Search is designed but NOT built and NOT confirmed.** Zero lines of Feature 42 code exist. The `/architect` session reached a 6-decision list and stopped for developer sign-off.
- Feature 41 was verified end-to-end in a real browser *last* session (14/14 checks, documented in `progress-tracker.md`). This session re-verified only typecheck/lint/build — no browser pass, none needed.
- No dev servers were left running this session.

## Next session starts with

**Get the developer's answers to the six Feature 42 decisions below, then build it.** The reading is already done — these are the relevant files and what each needs:

- `backend/src/queries/hotels.queries.ts:136-174` — `findSimilarHotels`, currently `city = ? AND country = ?`, ordered by `ST_Distance` from the hotel's own point, limit 6. Generalize to `ST_DWithin`.
- `backend/src/services/search.service.ts:57-97` — the haversine + `sortResults`. The `"distance"` case sorts against the **centroid of the result set**, which is meaningless. Replace with a real anchor.
- `backend/src/queries/search.queries.ts:29-73` — `findCandidateHotels`. The radius filter belongs here in SQL so it prunes early, not in JS afterwards.
- `backend/src/types/search.schemas.ts` — `searchQuerySchema` needs the new `near` / `radiusKm` params; `SEARCH_SORT_OPTIONS` already contains `"distance"`.
- `backend/src/services/search-extraction.service.ts:78-79` — the line that **withholds** `"distance"` from the model's vocabulary. Feature 42 is what supplies the anchor, so this filter comes off here.
- `agent/src/chains/smart_search/prompts.py` — currently instructs the model to put landmarks in `unmapped` and explicitly says "A mood or a landmark never goes in destination." Needs a `near` key instead.
- `agent/src/schemas/smart_search.py` — `ExtractedFilters` needs the matching field.
- `backend/src/services/geocoding/` — `geocodingProvider.geocode(address)` → `{latitude, longitude}` via Mapbox, already used by admin hotel create. This is the landmark resolver. Needs `MAPBOX_ACCESS_TOKEN` set (it was working as of Feature 07).

## Open questions

**The six Feature 42 decisions awaiting developer sign-off** (recommendation given for each; #2 is the one that cannot be sensibly guessed):

1. **Anchor resolution order** — try a hotel-name lookup against our own DB first (free, exact, and the acceptance test names a hotel), fall back to Mapbox geocoding otherwise. No cache table: a free-text phrase is not enumerable, so Feature 39's rule lands the same way it did for Feature 40.
2. **URL shape — the blocking one.** Recommended: `near=Eiffel Tower` as text plus optional `radiusKm`, resolved server-side per request; keeps the URL shareable and geocoding behind the backend per Feature 07's precedent. Cost: a Mapbox call per search *including every pagination click* — a module-level phrase→coords `Map` would blunt it. The alternative (resolve client-side, put coordinates in the URL) changes `searchQuerySchema`, frontend `SearchState` and the chip, so guessing wrong means rework across all three.
3. **`sort: "distance"` with no anchor** — fall back to `recommended` and delete the haversine entirely. Auto-apply `sort: "distance"` when the extraction returns a `near`. Open sub-question: whether the sort dropdown should hide/disable "Distance" when no anchor is set, rather than silently doing something else.
4. **Extraction path** — a real `near` field in the chain, *not* a heuristic over `unmapped`. Distinguishing "romantic" from "the Eiffel Tower" is exactly the judgment the model should make. Note this reads as a deviation from `progress-tracker.md`'s "42 consumes the `unmapped` list rather than building a new extraction path" — the intent there was avoiding a second round-trip, which a `near` field also avoids, but confirm the developer agrees.
5. **Radii** — 5 km default for search (50 km cap), 25 km for the similar-hotels rail. Both are guesses; sanity-check against the seeded data (5 hotels across 3 cities), since a 25 km radius roughly preserves today's same-city behaviour but no longer breaks on a differing suburb string.
6. **Scope addition, needs an explicit yes/no** — return `distanceKm` per result and render it on the hotel card. Nearly free (`ST_Distance` is already computed) and a distance-ordered list without distances is unreadable, but it is beyond the plan's literal wording.

**Carried over, unrelated to 42:** `trust proxy` must be settled at deployment or the IP-keyed `aiRateLimit` is effectively disabled in production. S3 credentials are still blank in this dev environment (open Known Issue since Feature 07).

## Note on secrets

No credentials, tokens or keys are recorded in this file. `MAPBOX_ACCESS_TOKEN`, `S3_*` and `RESEND_API_KEY` are referred to by name only.
