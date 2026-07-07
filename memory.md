# Memory — Feature 09 Search Backend Wiring (+ post-/review fixes)

Last updated: 2026-07-07

## What was built

Backend: `GET /search` wired to real data, replacing Feature 06's mock array.
- `backend/src/queries/search.queries.ts` — `findCandidateHotels` (destination/star/guest-rating/amenity-id hotel-level filters), `findCandidateRoomTypes` (capacity/meal-plan/room-feature-id room-level filters), `findRateOverridesForRoomTypes` — all plain Drizzle builder queries, no raw SQL.
- `backend/src/services/availability.service.ts` (new) — `enumerateStayDates`, `findQualifyingRoomTypes`, `pickCheapestPerHotel`. Per-date effective-inventory/price math done in plain JS over the query results, not a SQL `generate_series`/CTE.
- `backend/src/services/search.service.ts` — orchestrates candidates → qualifying room types → price/amenity filtering → sort (`price_asc`/`desc`/`guest_rating`/`star_rating`/`distance`/`recommended`) → pagination.
- `backend/src/controllers/search.controller.ts` + `routes/search.routes.ts` — `GET /search`, zod-validated query params, defaults `checkIn`/`checkOut` to today/tomorrow when omitted.
- Three new public lookup endpoints: `GET /amenities`, `/room-features`, `/meal-plans` (`controllers/{amenities,room-features,meal-plans}.controller.ts` + matching routes, no `requireAdmin`) — reuse the existing admin `list*ForPicker` service functions.
- `backend/src/types/search.schemas.ts` — zod schema for all query params.

Frontend: `frontend/features/search/`
- `useSearchResults.ts` rewritten to call the real API via the existing `apiClient` (no new dependency), deriving `isLoading` by comparing the query the held data was fetched for vs. the current query (avoids the `set-state-in-effect` lint rule).
- `useSearchCatalogs.ts` (new) — fetches `/amenities`, `/room-features`, `/meal-plans` once, shared by `FilterSidebar`/`ActiveFilterChips` via a `catalogs` prop from `SearchPageContent`.
- `FilterSidebar.tsx`/`ActiveFilterChips.tsx` — amenities/room-features/meal-plans now id-based (real UUIDs), Landmarks section/filter removed entirely.
- `HotelCard.tsx` — discount badge and "X km from landmark" line removed; "View on map" pin-button `onLocate` is now a **required** prop (every call site provides it).
- `MapView.tsx` — `selectedHotelId` lifted out to `SearchPageContent` (controlled `selectedHotelId`/`onSelectHotel` props, not local state), so Grid/List's "View on map" can select a hotel *and* switch views in one action.
- `SearchPageContent.tsx` — owns `selectedHotelId`, `handleLocate(hotelId)` (sets it + switches `view` to `"map"`), passes `catalogs` down.
- `types.ts` — `SearchResultHotel`/`SearchApiResponse`/`CatalogOption` added; `landmarks` removed from `SearchState`.
- `mock-hotels.ts` deleted (nothing references it anymore).

## Decisions made

- **Landmarks filter and discount badge dropped, not stubbed** — neither has schema backing (`architecture.md` has no landmarks table or discount column; Feature 06's mock data invented both). `distance` sort instead orders by distance from the centroid (mean lat/lng) of the matched result set, computed in JS in `search.service.ts` — no external geocoding call per search.
- **Availability math lives in JS, not SQL** — `code-standards.md` forbids raw SQL strings, and `generate_series`/CTE joins don't fit Drizzle's chained builder. A stay's date range is always small, so per-date JS aggregation in `availability.service.ts` is simpler and equally correct. Reusable by Feature 12/13 (hotel details, room selection) — call `findQualifyingRoomTypes`/`pickCheapestPerHotel` rather than re-deriving.
- **Filters switched from name-strings to real UUIDs** — matches what the DB actually stores; 3 new public catalog endpoints supply `{id, name}` option lists.
- **Map view pageSize capped at 100** (frontend `MAP_VIEW_PAGE_SIZE`) to match the backend's zod cap — a public unauthenticated endpoint shouldn't allow unbounded result sizes.

## Problems solved

- **Drizzle `sql` template array gotcha**: `sql\`... = ANY(${array}::uuid[])\`` is wrong — Drizzle spreads an interpolated JS array into a parenthesized comma-list (`IN (...)` shape), not a bound Postgres array. Caused `malformed array literal` at runtime, not caught by `tsc`. Fixed everywhere to `column IN ${array}`. Documented in `library-docs.md`'s Drizzle ORM section — watch for this pattern in any future filter.
- **`/review` pass caught 4 more issues, all fixed and verified:**
  1. "View on map" was a dead button outside Map view (`onLocate` was `undefined` in Grid/List). Fixed via Option B: lifted `selectedHotelId` state up, clicking it now switches view *and* selects/centers that specific hotel (verified: clicking the 2nd card selects the 2nd hotel, not just `hotels[0]`).
  2. Map view silently could show 0 results after paginating in Grid/List first (`state.page` leaked into the map request). Fixed by forcing `page: 1` for map-view requests.
  3. A degenerate date range (only one of `checkIn`/`checkOut` supplied) slipped past zod's `.refine` and produced `NaN` pricing while still marking a room type "available" — violates the "money/inventory not best-effort" rule. Fixed with a controller-level check on the resolved dates (400) plus a defensive guard in `findQualifyingRoomTypes`.
  4. `FilterSidebar`/`ActiveFilterChips` each independently fetched the same 3 catalog endpoints (6 requests instead of 3, no error handling). Fixed with the shared `useSearchCatalogs()` hook.

## Current state

Feature 09 fully built, reviewed, fixed, and verified. Both `tsc --noEmit`, `eslint`, and production builds (`pnpm build` / `next build`) are clean on backend and frontend. Verified end-to-end against the real seeded local Postgres via direct `curl` (destination/star/guest-rating/amenity-id/room-feature-id/free-cancellation filters, sort, pagination, a real blackout-date rate override, a real seasonal-price override, the date-validation 400) and a real headless-browser pass (Playwright via a hand-rolled script — no project `chromium-cli`/run-skill exists yet, none was created since nothing beyond ad hoc verification was needed).

Context docs all updated: `progress-tracker.md` (Feature 09 marked complete, Completed Features entry, 5 Architecture Decisions entries including the post-review-fixes one), `architecture.md` (routes tree, Search data-flow section note on the landmark/discount cut and JS-based availability math), `library-docs.md` (new Drizzle `IN` vs `ANY` gotcha section), `ui-registry.md` (`HotelCard`/`FilterSidebar`/`ActiveFilterChips`/`MapView` entries corrected to reflect current reality — no new visual patterns were introduced this session, only removals and data-plumbing changes).

Backend dev server (`tsx watch`, port 4000) and frontend dev server (port 3000) were both left running.

## Next session starts with

Feature 10 — Recent Searches + Search Suggestions, per `progress-tracker.md`'s "Next up": `recent_searches` written on every search (scoped to guest cookie or logged-in user), search-while-typing suggestions from previously searched destinations plus known hotel/city names, guest→account merge on login (same pattern Feature 17 will use for favorites).

## Open questions

None blocking. Pre-existing, unrelated to this feature: seeded hotel images use a fake placeholder domain (`images.stayzy.dev`) that doesn't resolve — the real S3 upload path was already proven working in Feature 08 via an actual upload, just not for the seed script's own demo image URLs.
