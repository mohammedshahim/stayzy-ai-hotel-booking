# Memory — Feature 13 Room Selection

Last updated: 2026-07-10

## What was built

Feature 13 — Room Selection:

Backend:
- `backend/src/types/room-type.schemas.ts` — new `roomTypeAvailabilityQuerySchema` (`checkIn`/`checkOut`/`adults`/`kids`/`rooms`, same refine-based ordering check as `searchQuerySchema`).
- `backend/src/services/availability.service.ts` — new `resolveRoomTypeAvailability(roomTypes, stayDates, overrides)`, generalizing `findQualifyingRoomTypes`'s per-night rate-override loop to return a `remainingInventory` count (min effective inventory across the stay) instead of just a pass/fail boolean.
- `backend/src/services/room-type.service.ts` — new `listRoomTypesWithAvailability(params)`: combines the existing (previously admin-only) `listRoomTypesForHotel` with `resolveRoomTypeAvailability`, drops room types whose capacity doesn't fit the party, keeps sold-out ones with `isSoldOut: true`, resolves meal plan names, sorts by `basePrice` ascending.
- `backend/src/controllers/hotels.controller.ts` (new `getHotelRoomTypes`) + `backend/src/routes/hotels.routes.ts` (`GET /hotels/:id/room-types`, sibling to `GET /hotels/:id`) — same published/non-deleted 404 check and post-default date-ordering re-check as the existing `getHotel`/`GET /search`.

Frontend:
- `frontend/features/search/components/HotelCard.tsx` — now reads `checkIn`/`checkOut`/`adults`/`kids`/`rooms` via `useSearchParams()` and appends them to its own `/hotels/[id]` link.
- `frontend/app/hotels/[id]/page.tsx` — now also awaits `searchParams`, parses them into a `RoomSelectionSearch` (defaults: today/tomorrow, 2 adults/0 kids/1 room), passed to `HotelDetailsContent` as `initialSearch`.
- `frontend/features/hotel-details/types.ts` — added `RoomSelectionSearch`, `RoomTypeFeature`, `RoomTypeImage`, `RoomTypeAvailability`.
- `frontend/features/hotel-details/hooks/useRoomTypes.ts` (new) — same `AbortController` + `forQuery`-comparison re-fetch pattern as `useSearchResults`.
- `frontend/features/hotel-details/components/{RoomSelectionSection,RoomTypeCard}.tsx` (new) — date/guest picker (reusing `DateRangePicker`/`GuestsRoomsPicker` from `features/search/components/` verbatim) + room type list; wired into `HotelDetailsContent` between `AmenitiesList` and `PoliciesSection`.

Context docs updated: `progress-tracker.md` (Feature 13 marked complete, moved to Feature 14 Map Integration), `architecture.md` (new "Room Selection" Data Flow subsection), `ui-registry.md` (new "Room Selection" entry, imprinted while building — prose format matching every other entry).

## Decisions made

- **Dates/guests carried from search into hotel details via URL query params** on `HotelCard`'s link, used only to seed the details page's own local state (not synced back to that page's own URL) — otherwise a user who searched specific dates would land on hotel details seeing today/tomorrow pricing instead.
- **`GET /hotels/:id/room-types` is a separate endpoint**, not folded into `GET /hotels/:id` — the room list is date/guest-dependent and re-fetched on every change, while the rest of the hotel payload loads once.
- **Capacity mismatch → room type hidden entirely** (matches `/search`'s existing behavior). **Sold out (fits party, no inventory for dates) → room type shown, disabled, "Sold out for these dates"** — this is a single-hotel page, so silently vanishing would read as a bug, not a filter.
- **Reserve button is always disabled** (label swaps "Coming soon" / "Sold out") — real, correctly-styled UI, not hidden and not wired to a not-yet-built route, since `POST /bookings` doesn't exist until Feature 19. This is the one call site Feature 19 needs to update.
- **Room list dims (`opacity-60`) during a date/guest-change re-fetch**, no skeleton — the page around it is already loaded, so a full skeleton flash on every date tweak would be jarring.

## Problems solved

Nothing that took real debugging this session — implementation went cleanly against the existing `availability.service.ts`/`listRoomTypesForHotel` foundations from Features 08/09/12. All verification (rate-override price/inventory shift, capacity filtering, sold-out state, interactive re-fetch on a real Guests+ click) passed on the first pass.

## Current state

Feature 13 fully built, architected (`/architect` session), implemented, and verified end-to-end:
- `tsc --noEmit`, `eslint`, and both `pnpm build`/`next build` clean for backend and frontend.
- Direct `curl` against the seeded DB confirmed: default-date fallback, explicit dates, 400 on inverted dates, 404 on a missing hotel, a real inserted `rate_overrides` row correctly shifting `avgNightlyPrice` and flipping `remainingInventory`/`isSoldOut` only for the date range/room type it applies to, and a party size exceeding every room type's capacity returning an empty list. Test override rows were deleted after.
- Real headless-browser pass (Playwright, ad hoc in scratchpad): dates carry over correctly from a `/search` link into hotel details (date picker pre-filled "Aug 1 – Aug 5"), both room types render with real images/prices/remaining-inventory/disabled "Coming soon" buttons, the sold-out scenario reproduced live as dimmed cards with disabled "Sold out" buttons, a 10-adult party rendered the "No rooms available" empty state, and clicking the real Guests "+" control triggered a real network re-fetch (`adults=3`). Zero console errors across every scenario.
- Ran `/imprint` after building — `ui-registry.md`'s "Room Selection" entry confirmed accurate against a fresh read of both component files, no gaps.

All changes are uncommitted (developer has not yet been asked to commit):
- Modified: `backend/src/types/room-type.schemas.ts`, `backend/src/services/availability.service.ts`, `backend/src/services/room-type.service.ts`, `backend/src/controllers/hotels.controller.ts`, `backend/src/routes/hotels.routes.ts`, `frontend/features/search/components/HotelCard.tsx`, `frontend/app/hotels/[id]/page.tsx`, `frontend/features/hotel-details/types.ts`, `frontend/features/hotel-details/components/HotelDetailsContent.tsx`, `context/architecture.md`, `context/progress-tracker.md`, `context/ui-registry.md`
- New: `frontend/features/hotel-details/hooks/useRoomTypes.ts`, `frontend/features/hotel-details/components/{RoomSelectionSection,RoomTypeCard}.tsx`

Dev servers were left running (backend :4000, frontend :3000) — may or may not still be up depending on machine state between sessions.

## Next session starts with

Feature 14 — Map Integration, per `progress-tracker.md`'s "Next up": a map on the hotel details page showing the hotel's location via `hotels.location` (PostGIS point, already populated since Feature 07's geocoding). `ui-rules.md`'s "Hotel Details Layout" spec describes a `grid gap-8 lg:grid-cols-[1fr_22rem]` two-column layout with a sticky right rail holding "map panel + booking summary panel" — Features 12/13 deliberately built a single-column layout instead since neither the map nor a booking summary existed yet. Feature 14 may be the natural point to decide whether to introduce that two-column restructure (this hasn't been discussed with the developer yet — flag it during `/architect`, don't assume). `MapView`'s existing `react-map-gl`/`mapbox-gl` pin pattern from Feature 06/09's search results is the likely component to reuse for a single-pin map here.

## Open questions

- Whether to commit the uncommitted Feature 13 changes — ask the developer at the start of next session (not yet requested this session).
- Whether Feature 14 should also revisit the hotel details page's overall layout (single-column vs. the two-column `ui-rules.md` spec) — not yet discussed with the developer.
