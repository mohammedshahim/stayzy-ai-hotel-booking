# Memory — Feature 15 (Similar Hotels) + Admin Manual Location Override

Last updated: 2026-07-11

## What was built

**Feature 15 — Similar Hotels:**
- Backend: `GET /hotels/:id/similar` (`hotels.controller.ts`'s `getHotelSimilar`, `hotels.routes.ts`) — returns up to 6 other published hotels in the same `city`+`country` as the given hotel, excluding itself, ordered by `ST_Distance` only (no rating in ranking). New `findSimilarHotels` in `hotels.queries.ts`, thin passthrough `getSimilarHotels` in `hotel.service.ts`. New `SimilarHotel` type in `backend/src/models/hotel.schema.ts`.
- Frontend: `frontend/features/hotel-details/hooks/useSimilarHotels.ts`, `components/{SimilarHotelCard,SimilarHotelsSection}.tsx` (new), wired into `HotelDetailsContent.tsx`'s main column after `PoliciesSection`. New `SimilarHotel` type in `frontend/features/hotel-details/types.ts`.
- Renders nothing (no heading, no empty state) when a hotel has no siblings in its city — confirmed intentional via real test (lone New York hotel).

**Admin manual location override (post-Feature-07 enhancement):**
- Backend: `hotelInputSchema` (`backend/src/types/hotel.schemas.ts`) gained optional `latitude`/`longitude`. `hotel.service.ts`'s new `hasManualCoordinates()` guard makes `createHotel`/`updateHotelById` use explicit coordinates when both are provided, skipping the Mapbox geocode call entirely; falls back to the original address-geocode behavior otherwise.
- Admin frontend: new `frontend-admin/src/features/hotels/components/HotelLocationPicker.tsx` — a draggable-pin `react-map-gl` map, edit-mode-only (no picker on create; create still geocodes from the address as before). Wired into `HotelFormPage.tsx` right after the address fields. `HotelFormInput` (`frontend-admin/src/features/hotels/types.ts`) gained optional `latitude`/`longitude`.
- New dependency: `react-map-gl`/`mapbox-gl` added to `frontend-admin` for the first time (same versions as `frontend/`). New `VITE_MAPBOX_ACCESS_TOKEN` env var in `frontend-admin/.env` + `.env.example` — reuses the same public Mapbox token already shipped in `frontend/`'s bundle (not a new secret).

**Docs updated:** `context/progress-tracker.md` (Feature 15 marked complete, admin override logged as a post-Feature-07 enhancement, two new Architecture Decision entries, next up set to Feature 16 Reviews Display), `context/ui-registry.md` (`SimilarHotelsSection`/`SimilarHotelCard` and `HotelLocationPicker` entries added), `context/architecture.md` (new "Similar Hotels" data-flow section), `context/code-standards.md` (new `frontend-admin` dependency, `VITE_MAPBOX_ACCESS_TOKEN` env var row, and backfilled a pre-existing gap: `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` for `frontend/` was never in the env var table despite being used since Feature 06).

## Decisions made

- Similar Hotels ranks by distance only, no rating tiebreak or blended score — explicit developer steer to keep it simple; revisit only if actually needed later.
- "Same destination" scoped to exact `city`+`country` match, not a PostGIS radius (`ST_DWithin`) — simpler, and the city/country filter already bounds the result set before the GiST-indexed distance sort runs.
- New `SimilarHotelCard` built instead of reusing search's `HotelCard` — that component requires an `onLocate` prop (no map to sync with here) and carries price/room-type fields with no dates/party-size context on the hotel details page.
- Admin location override is geocode-then-adjust, not manual-entry-only — create mode still geocodes from the address (fast default), drag-to-fine-tune only appears once a hotel exists to show a pin for (edit mode). Kept purely additive — no changes to the `GeocodingProvider` interface.

## Problems solved

- None that took real debugging. The only non-trivial part was confirming the admin Vite dev server needed a restart to pick up the newly-created `frontend-admin/.env` file (Vite only reads `.env` at startup) — restarted it as part of verification, not a bug in the code itself.

## Current state

Both pieces of work are fully built, verified, and documented — but **uncommitted**. The developer was asked at the end of the last response whether to commit; no reply yet.

Verified end-to-end for both:
- Backend `tsc --noEmit` + `pnpm build`, frontend `tsc --noEmit`/`eslint`/`next build`, frontend-admin `tsc --noEmit`/`vite build` — all clean.
- Similar Hotels: direct `curl` against real seeded data confirmed correct siblings/ordering/empty-case/404; real Playwright pass at desktop + mobile widths, zero real console errors.
- Admin location override: real Playwright pass — logged into the admin panel with the seeded admin account, opened a real hotel (Grand Mercure Dubai City), confirmed real Mapbox tiles rendered, dragged the pin, saved, and confirmed via direct `curl` afterward that the exact dragged coordinates persisted (not the original geocoded ones); reload showed the map still centered on the new position.

Dev servers were left running: backend :4000, frontend :3000, frontend-admin :5173 (restarted mid-session to pick up the new env var) — may or may not still be up depending on machine state between sessions.

## Next session starts with

Two options depending on developer preference:
1. Commit the Feature 15 + admin-override changes (was asked, unanswered).
2. Feature 16 — Reviews Display, per `progress-tracker.md`'s "Next up": `GET /hotels/:id/reviews` (aggregate rating breakdown + individual reviews list) rendered on hotel details, below `SimilarHotelsSection`. Review creation itself is Phase 6 (Feature 24) — Feature 16 is display-only, reviews are seeded/existing data.

## Open questions

- Whether to commit the current uncommitted changes — ask at the start of next session if not already resolved.
- None else outstanding; both pieces of work were fully resolved within this session (no deferred decisions).
