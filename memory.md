# Memory — Feature 42 Nearby Search built and verified, uncommitted

Last updated: 2026-07-23

## What was built

**Feature 42 Nearby Search, complete and verified.** Phase 12 Smart Search is now done (40, 41, 42). A search can be anchored to a point: `near` (free text) + `radiusKm` filter via `ST_DWithin` in SQL, results carry a real `distanceKm`, and `sort: "distance"` finally measures from something.

New files:
- `backend/src/services/search-anchor.service.ts` — resolves `near` to one lat/long
- `frontend/features/search/lib/anchor.ts` — `clearAnchor(state)`

Modified — `agent/` (2): `chains/smart_search/prompts.py` (landmarks now route to `near`, not `unmapped`), `schemas/smart_search.py` (`near` on `ExtractedFilters`).

Modified — backend (10): `types/search.schemas.ts` (`near`, `radiusKm`, `DEFAULT_SEARCH_RADIUS_KM`/`MAX_SEARCH_RADIUS_KM`), `types/search-extraction.schemas.ts`, `services/search-extraction.service.ts` (new `pickSort`; stopped withholding `"distance"` from the model), `queries/search.queries.ts` (`ST_DWithin` + `ST_Distance/1000` in the select), `services/search.service.ts` (haversine/centroid deleted, `anchor` on the response), `controllers/search.controller.ts`, `queries/hotels.queries.ts` (new `findHotelLocationByName`; `findSimilarHotels` city equality → `ST_DWithin` 25km), `services/hotel.service.ts`, `services/geocoding/{geocoding,mapbox}.provider.ts` (new `geocodePlace`).

Modified — frontend (8): `types.ts`, `hooks/useSearchState.ts`, `hooks/useSearchResults.ts` (surfaces `anchor`), `lib/extraction.ts`, `components/{ActiveFilterChips,HotelCard,SortDropdown,SearchPageContent}.tsx`.

Modified — `context/` (4): `progress-tracker.md`, `ai-phase-plan.md`, `architecture.md`, `ui-registry.md`.

**No migration, no new table, no new dependency.**

## Decisions made

Each of these is written up in full in `context/progress-tracker.md`'s Feature 42 entry — recorded here only as pointers, not duplicated.

- **Anchor resolution: own `hotels` table first (name `ilike`, shortest match wins), geocoder only on a miss.** Hotel names never touch Mapbox.
- **`near` resolves server-side per request**, not client-side coordinates in the URL. Search paginates in JS *after* building the full result set, so every page click re-resolves — absorbed by a module-level phrase→anchor `Map` that caches misses too and clears past 200 entries. **In-process map, not a table; Feature 39's no-cache-table rule is intact.**
- **The centroid haversine is deleted, not repaired.** No anchor → `sort: "distance"` falls back to `recommended` *and* the Distance option is disabled in `SortDropdown`.
- **A real `near` field in the extraction chain — a deviation from `ai-phase-plan.md:274`**, which expected a heuristic over `unmapped`. That line is now marked superseded in the plan itself. `pickSort` keeps the backend authoritative: a `near` forces `sort: "distance"`; a `distance` without a `near` is dropped.
- **Both radii 25 km** (search default, cap 100; similar-hotels rail fixed). Seed-driven, not guessed — see Problems solved.
- **`distanceKm` returned and rendered on the card** — an agreed scope addition beyond the plan's wording.
- **An unresolvable `near` degrades, never 400s** — response carries `anchor: null` and the UI says so.

## Problems solved

- **The Mapbox token has no POI data — the landmark path was silently anchoring on the wrong continent.** First run put `near=Eiffel Tower` in *the Philippines* and geocoded a garbage phrase "successfully" to California. Root cause is not a low score: "Eiffel Tower" matches a street named **Eiffel Tower Street** at relevance **1.0**, so no threshold catches it. Probing both the v5 and v6 APIs showed `types=poi` returns **nothing at all**. Fix: a separate `geocodePlace(query)` that excludes street/address types and requires relevance ≥ 0.8, leaving `geocode(address)` untouched for admin hotel create, which genuinely needs street matching. **Do not collapse the two methods.** Net effect: POI landmarks resolve to no anchor and say so; cities/neighbourhoods/districts work correctly. A POI-enabled token would light up the landmark path with zero code change.
- **The radius could not be guessed from intuition.** Measured against the real seed: the two Paris hotels are **2.4 km** apart, the two Tokyo hotels **10.5 km**. A 5 km default passes the Paris acceptance test but makes "near Shibuya Sky Hotel" return only itself; 10 km fails Tokyo by half a kilometre. Hence 25 km. **It is wide for a real city and only defensible because the seed is sparse.**
- **Playwright is not a project dependency** even though earlier features used it — browsers are cached under `~/Library/Caches/ms-playwright` but the package is absent. Install it `--no-save` into a scratch dir rather than adding it to `frontend/package.json`.

## Current state

- **Features 36–42 complete. Phase 12 is done.** Next phase is 13 (Chat Widget).
- Verified end-to-end in a real headless browser against the real seeded database: **15/15 checks, zero console errors.** Covers anchored ordering, distances on cards, the Near chip and its removal cascading to sort, the disabled Distance option, the honest unresolvable-landmark notice, a city anchor, and the similar-hotels rail.
- Backend `pnpm build`, frontend `tsc --noEmit` + `pnpm lint` + `pnpm build`, agent `ruff check` + `ruff format --check` — all clean.
- **All 26 changed files are uncommitted.** Working tree is dirty; `origin/main` and local `main` are both at `2716570`. Nothing was pushed.
- No dev servers left running. No test data created — this feature writes no rows.

## Next session starts with

**Commit Feature 42, then start Feature 43.**

Commit in four parts per the standing one-commit-per-concern rule — do not squash, stage by path:
1. `agent/` — the `near` extraction field and prompt rules
2. backend — anchor resolution, `ST_DWithin`, the `geocodePlace` split
3. frontend — `near` in URL state, the chip, card distance, sort rule
4. `docs(context)` — the four context files

Then **Feature 43 Widget graph** — read `context/ai-phase-plan.md`, not `build-plan.md`. First feature of Phase 13 and the first to use LangGraph rather than a single-shot chain.

## Open questions

- **Should the 25 km default be revisited before production?** It is a sparse-seed artefact. Real inventory would want something tighter, and the number lives in one constant (`DEFAULT_SEARCH_RADIUS_KM` in `search.schemas.ts`, plus `SIMILAR_HOTELS_RADIUS_KM` in `hotels.queries.ts`).
- **Is a POI-enabled Mapbox plan worth buying?** The landmark half of nearby search is written and correct but inert with the current token — "hotels near the Eiffel Tower" honestly reports that it could not place the landmark. No code change needed if the token gains POI access.
- **Carried over, unrelated to 42:** `trust proxy` must be settled at deployment or the IP-keyed `aiRateLimit` is effectively disabled in production. S3 credentials are still blank in this dev environment (open Known Issue since Feature 07).

## Note on secrets

No credentials, tokens or keys are recorded in this file. `MAPBOX_ACCESS_TOKEN`, `DATABASE_URL`, `S3_*` and `RESEND_API_KEY` are referred to by name only.
