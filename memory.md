# Memory — Feature 12 Hotel Details UI

Last updated: 2026-07-10

## What was built

Feature 12 — Hotel Details UI:

Backend:
- `backend/src/services/hotel.service.ts` — new `getPublishedHotelDetails(id)`, returns the admin's existing `HotelWithDetails` shape (hotel fields + amenities + images) gated to `status === "published"` and non-deleted; returns `null` (not a thrown error) for missing/draft/deleted so the controller can 404 explicitly.
- `backend/src/controllers/hotels.controller.ts` (new, public) + `backend/src/routes/hotels.routes.ts` (new, public) — `GET /hotels/:id`, mounted in `routes/index.ts`. First endpoint in the app with a real 404 (every prior "not found" case was admin-only and just threw → 500).

Frontend — new `frontend/features/hotel-details/`:
- `types.ts`, `hooks/useHotelDetails.ts` (same `useState`/`useEffect`/`apiClient.get` hook shape as every other feature; uses `useSearchResults`'s `forId`-comparison trick to derive `isLoading` rather than a synchronous `setState` in the effect, to avoid the `react-hooks/set-state-in-effect` lint rule).
- `lib/amenity-icons.ts` — icon-slug → lucide-icon lookup (first real render of `amenities.icon` anywhere in the app; `FilterSidebar` stayed text-only).
- `components/{HotelGallery,AmenitiesList,PoliciesSection,HotelDetailsSkeleton,HotelDetailsContent}.tsx`.
- `frontend/app/hotels/[id]/page.tsx` — thin async Server Component (`params` is a Promise in this Next.js version — must `await`), wraps the Client Component.

Context docs updated: `progress-tracker.md` (Feature 12 marked complete, moved to Phase 3 / Feature 13 Room Selection), `architecture.md` (new "Hotel Details" data-flow section), `ui-registry.md` (new "Hotel Details Page" entry via `/imprint`, following this project's established prose format rather than the skill's generic table template).

## Decisions made

- **Route stays keyed by hotel `id`, not `slug`** — matches `HotelCard`'s existing placeholder link from Feature 09. `slug` remains unused for routing.
- **Public payload reuses the admin's `HotelWithDetails` shape** rather than a new public-specific shape — same hotel fields + amenities + images, just published-only and unauthenticated.
- **404 handled via explicit null-return + controller-side status check**, not a thrown-error/status-class convention — matches the codebase's existing explicit-check style (e.g. `uploadHotelImage`'s `if (!req.file)`), since this is the first endpoint that ever needed a real 404.
- **Amenity icons added now** (icon-slug → lucide lookup, ~10 lines, fallback icon for unmapped slugs) — developer's call during `/architect`, first real use of `amenities.icon`.
- **Client-hook + inline-skeleton fetch pattern**, not Next's `loading.tsx`/Server Component convention — matches `useSearchResults`/`useTrendingDestinations` precedent exactly.
- **In-page EmptyState for not-found**, not a new `not-found.tsx` — the frontend can't distinguish a 404 from any other fetch failure through `apiClient`'s response shape (same limitation every other hook already has), so both render the same "Hotel not found" state.
- **Gallery**: hero (`is_main` image) + clickable thumbnail strip swapping the hero via local state, no lightbox — kept minimal per this project's repeated MVP-simplicity pattern. No-image fallback uses `ImageOffIcon`, not `MapPinIcon` (deliberately different from Trending Destinations' fallback — "no photo" reads better than "place" for an empty gallery).
- **Star rating + guest rating badge rendered unconditionally**, not gated on `reviewCount > 0` — matches `HotelCard`'s existing precedent exactly.

## Problems solved

- First naive version of `useHotelDetails` called `setState` synchronously at the top of the effect body (to reset loading state on `id` change) — tripped `react-hooks/set-state-in-effect`, the same rule the Feature 06 price-slider fix hit. Fixed by adopting `useSearchResults`'s `forId`-comparison pattern (derive `isLoading` from comparing the id the held data was fetched for against the current id) instead of an explicit reset call.
- Confirmed Next.js in this app has `params` as a `Promise<{id: string}>` (not synchronous) — verified against `node_modules/next/dist/docs` before writing the page, per this repo's `AGENTS.md` warning that this Next.js version has breaking changes from training-data assumptions.

## Current state

Feature 12 fully built, architected (`/architect` session), implemented, and verified end-to-end in a real headless browser (Playwright, ad hoc in scratchpad — still no project-specific run skill for this app): a real seeded hotel (Hotel Marais Charme) renders hero image (`naturalWidth` confirmed non-zero) + working thumbnail-click gallery swap, amenities render with correct icons (wine glass/wifi/utensils), policies show correct check-in/out times and cancellation text, star rating renders correctly, guest rating badge + review count render unconditionally. A nonexistent hotel id renders the "Hotel not found" EmptyState (backend confirmed 404 via curl). A throttled-network pass confirmed the skeleton renders immediately after navigation before content loads. Clicking a hotel card on `/search` navigates correctly to the real details page. Zero console errors beyond the expected/benign logged 404 network response for the not-found case. `tsc --noEmit`, `eslint`, and both `pnpm build`/`next build` clean for backend and frontend.

All changes are uncommitted (developer has not yet been asked to commit):
- Modified: `backend/src/routes/index.ts`, `backend/src/services/hotel.service.ts`, `context/architecture.md`, `context/progress-tracker.md`, `context/ui-registry.md`
- New: `backend/src/controllers/hotels.controller.ts`, `backend/src/routes/hotels.routes.ts`, `frontend/app/hotels/[id]/`, `frontend/features/hotel-details/`

Dev servers were left running (backend :4000, frontend :3000) — may or may not still be up depending on machine state between sessions.

## Next session starts with

Feature 13 — Room Selection, per `progress-tracker.md`'s "Next up": room type list on the hotel details page with per-room pricing for the selected dates, remaining inventory, and a Reserve action — availability resolved through the existing `availability.service.ts` (`enumerateStayDates`/`findQualifyingRoomTypes`/`pickCheapestPerHotel`, built in Feature 09 and already noted there as reusable for Feature 12/13). No flagged blockers — straightforward next feature in Phase 3, and the hotel details page it slots into already exists.

## Open questions

- Whether to commit the uncommitted Feature 12 changes — ask the developer at the start of next session (not yet requested this session).
- None blocking on Feature 13 itself.
