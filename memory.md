# Memory — Feature 14 Map Integration

Last updated: 2026-07-10

## What was built

Feature 14 — Map Integration:

- `frontend/features/hotel-details/types.ts` — added `latitude`/`longitude` to `HotelDetails` (backend already returned both; just wasn't typed/used on the frontend yet).
- `frontend/features/hotel-details/components/LocationMapPanel.tsx` (new) — sticky right-rail panel: a single-pin `react-map-gl` map (same `mapStyle`/pin styling as `/search`'s `MapView`, zoom 14, no fly-to/click logic since there's only one point) plus a "Get directions" link out to Google Maps built from the hotel's own lat/lng.
- `frontend/features/hotel-details/components/HotelDetailsContent.tsx` — restructured from a single-column stack into `ui-rules.md`'s two-column Hotel Details Layout: gallery + title/rating/address header stays full-width, then `grid gap-8 lg:grid-cols-[1fr_22rem]` with description/Amenities/RoomSelection/Policies in the main column and `LocationMapPanel` in a `lg:sticky lg:top-20` right rail. Page container grew `max-w-5xl` → `max-w-6xl` to fit the new column.
- No backend changes — `GET /hotels/:id` already returned `latitude`/`longitude` via `hotels.queries.ts`'s `HOTEL_COLUMNS` (`ST_Y`/`ST_X` over `hotels.location`) since Feature 12.
- Context docs updated: `progress-tracker.md` (Feature 14 marked complete, moved to Feature 15 Similar Hotels, new Architecture Decision entry), `architecture.md` (new "Map Integration" Data Flow subsection), `ui-registry.md` (Hotel Details Page entry updated for the new grid layout, new `LocationMapPanel` entry — first real use of the locked Panel pattern in either app).

## Decisions made

- **Two-column right rail introduced now**, not deferred until the booking summary panel exists (Feature 19+/21) — restructures the layout once instead of twice. Confirmed during `/architect`; this was an explicitly flagged open question carried over from the Feature 13 session.
- **Interactive Mapbox map**, not a static image — reuses the exact `react-map-gl`/`mapStyle` pattern already in the app (`MapView.tsx`), no new dependency, no new pattern.
- **Map panel includes a "Get directions" link** (Google Maps, opens in a new tab) rather than being a bare map — a small real bit of utility beyond the build-plan's minimum ("renders a pin at the correct coordinates").

## Problems solved

Nothing that took real debugging — the backend already had the lat/lng data available (a pleasant surprise found while reading `hotels.queries.ts`'s `HOTEL_COLUMNS` before starting), so this ended up almost entirely a frontend layout + one new component task.

## Current state

Feature 14 fully built, architected (`/architect` session), implemented, imprinted (`/imprint`), and verified end-to-end:
- `tsc --noEmit`, `eslint`, and `next build` all clean.
- Direct `curl` confirmed `GET /hotels/:id` returns correct `latitude`/`longitude` for a real seeded hotel (Hotel Marais Charme, Paris: 48.8586, 2.3603).
- Real headless-browser pass (Playwright, ad hoc in scratchpad): map renders real Mapbox tiles (Le Marais streets) with the pin at the correct spot, "Get directions" link `href` resolves to the correct Google Maps URL with real coordinates, right rail sits correctly beside the main column and stays sticky at 1440px desktop, and at 390px mobile the panel correctly stacks below Policies with no horizontal overflow. Zero console errors at either width.

All changes are uncommitted (developer has not yet been asked to commit):
- Modified: `frontend/features/hotel-details/types.ts`, `frontend/features/hotel-details/components/HotelDetailsContent.tsx`, `context/architecture.md`, `context/progress-tracker.md`, `context/ui-registry.md`
- New: `frontend/features/hotel-details/components/LocationMapPanel.tsx`

Dev servers were left running (backend :4000, frontend :3000) — may or may not still be up depending on machine state between sessions.

## Next session starts with

Feature 15 — Similar Hotels, per `progress-tracker.md`'s "Next up": an `ST_DWithin`/`ST_Distance` query for nearby hotels in the same destination (excluding the current hotel, ranked by proximity + rating), rendered as a "Similar hotels" section below the fold on hotel details — likely reusing `HotelCard` (grid variant, same as `/search`'s Grid view) since it already renders everything a similar-hotel card needs. Need to decide during `/architect`: how "nearby" is scoped (same city? a radius in km?), whether sold-out-everywhere hotels should be excluded, and what the empty state looks like when a hotel has no nearby siblings (`build-plan.md`'s test explicitly calls this out: "hidden or a short empty state, not a broken layout").

## Open questions

- Whether to commit the uncommitted Feature 14 changes — ask the developer at the start of next session (not yet requested this session).
