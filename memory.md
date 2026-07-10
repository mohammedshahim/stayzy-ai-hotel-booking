# Memory — Feature 11 Trending Destinations (+ seed image fix)

Last updated: 2026-07-10

## What was built

Prerequisite fix (found before starting Feature 11):
- `backend/src/config/seed.ts` — all 20 hotel/room-type image URLs were pointing at a fake, non-resolving `images.stayzy.dev` domain. Replaced with real S3-hosted URLs.
- `backend/src/config/seed-images.ts` (new, one-off script, run via `pnpm seed:images`) — downloads real photos (Lorem Picsum, deterministic per hotel/room slug) and pushes them through the app's actual `uploadImage()`/S3 service (real credentials, already confirmed working), producing real `*.s3.ap-south-1.amazonaws.com` URLs that were then hardcoded into `seed.ts`. Re-ran `pnpm seed` to reload the DB with real images.

Feature 11 — Trending Destinations:
Backend:
- `backend/src/queries/trending-destinations.queries.ts` (new) — `findTopCitiesByHotelCount` (groups published hotels by city/country, `COUNT(*)` desc + `AVG(average_rating)` tiebreak, limit param) and `findTopHotelImageForCity` (one small follow-up query per city for that city's top-rated hotel's main image — deliberately two simple queries instead of one correlated subquery over a GROUP BY).
- `backend/src/services/trending-destinations.service.ts` (new) — `getTrendingDestinations()`, thin passthrough with `TRENDING_LIMIT = 8`.
- `backend/src/controllers/trending-destinations.controller.ts` + `routes/trending-destinations.routes.ts` — `GET /trending-destinations`, public, registered in `routes/index.ts`.

Frontend:
- `frontend/features/trending-destinations/hooks/useTrendingDestinations.ts` (new, same `useState`/`useEffect`/`apiClient.get` shape as `useRecentSearches.ts`).
- `frontend/features/trending-destinations/components/TrendingDestinations.tsx` — rewritten from 8 hardcoded placeholder cities to real data; cards are now `Link`s to `/search?destination="City, Country"`, real `<img>` photo with `MapPinIcon` fallback if a city has no main image, renders `null` if the endpoint returns nothing.

Context docs updated: `progress-tracker.md` (Feature 11 marked complete, moved to Phase 3 / Feature 12 Hotel Details UI), `architecture.md` (new Trending Destinations data-flow section), `ui-registry.md` (Trending Destination Card entry rewritten for real photos + no-caching decision).

## Decisions made

- **Ranking signal is hotel count per city (rating as tiebreaker), not real booking volume** — `bookings` table has no service/controller/data yet (Phase 5 territory). The ranking query (`findTopCitiesByHotelCount`) is isolated specifically so only it needs to change once real bookings exist; endpoint contract, service shape, and frontend all stay the same.
- **No caching layer**, despite `build-plan.md`'s spec text saying "cached briefly at the API layer" — explicit developer call, prioritizing MVP simplicity. No cache infra (in-memory or external) exists anywhere else in this codebase. Add one later only if it becomes a real cost.
- **Real hotel photos on trending cards** (my call during `/architect`, not explicitly requested) — reuses the same main-image subquery pattern already in `hotels.queries.ts`/`search.queries.ts`, low cost, makes the homepage look finished rather than a wireframe.
- **Seed images sourced via the real upload pipeline, not a third-party placeholder host** — developer's explicit choice (over just pointing at a public image host) so the seed data exercises genuine S3 storage rather than depending on an external domain staying up.

## Problems solved

- Seed data's fake `images.stayzy.dev` domain (never resolved) — root-caused before Feature 11 could show meaningful photos, fixed via the one-off `seed-images.ts` upload script described above.
- Confirmed no Drizzle/SQL correlated-subquery pitfalls by deliberately avoiding a single grouped-query-plus-correlated-subquery approach for the per-city main image — used two simple sequential queries instead (see Decisions).

## Current state

Feature 11 fully built, architected (`/architect` session), implemented, and verified end-to-end in a real headless browser (Playwright, ad hoc in scratchpad — still no project-specific run skill for this app): homepage shows 3 real cities (Paris, Tokyo, New York, matching current seed data) each with a real loaded photo (non-zero `naturalWidth`, not broken), clicking the Paris card navigates to `/search?destination=Paris%2C%20France` and shows "2 hotels found" with real photos on result cards, zero console errors. `tsc --noEmit` and both `pnpm build`/`next build` clean for backend and frontend.

Known cosmetic limitation, not a bug: trending card photos are generic stock photography (Lorem Picsum), not literal photos of Paris/Tokyo/etc. — acceptable for MVP, flagged to the developer, worth swapping for real destination-specific photography later if desired.

All work committed as 4 separate commits, NOT pushed to origin/main yet (developer hasn't been asked/confirmed a push):
1. `fix(backend): seed real S3-hosted hotel/room images instead of a fake domain`
2. `feat(backend): add trending destinations endpoint`
3. `feat(frontend): wire trending destinations to real backend data`
4. `docs: log Feature 11 completion and the seed image fix`

Dev servers were left running (backend :4000, frontend :3000) — may or may not still be up depending on machine state between sessions.

## Next session starts with

Feature 12 — Hotel Details UI, per `progress-tracker.md`'s "Next up": `/hotels/[id]` page (main image + gallery, description, amenities, policies, skeleton loading while data loads) backed by a new `GET /hotels/:id` endpoint returning the full hotel detail payload. No flagged blockers or decisions needed before starting — straightforward next feature in Phase 3.

## Open questions

- Whether to push the 4 unpushed commits to `origin/main` — ask the developer at the start of next session if it's still unpushed.
- None blocking on Feature 12 itself.
