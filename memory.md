# Memory — Feature 17 (Favorites)

Last updated: 2026-07-11

## What was built

**Feature 17 — Favorites:**
- Backend: `favorites.queries.ts`, `favorite.service.ts`, `favorites.controller.ts`, `favorites.routes.ts` (mounted at `/favorites` in `routes/index.ts`) — `GET /favorites` (full card data incl. `mainImageUrl`/`fromPrice`), `GET /favorites/hotel-ids` (bulk id set), `POST /favorites { hotelId }`, `DELETE /favorites/:hotelId`. `favorite.schemas.ts` for body validation. The `favorites` Drizzle table already existed from the Feature 02 migration batch, unused until now.
- Guest→account merge: `mergeGuestFavorites` wired into `config/auth.ts`'s existing `hooks.after`, alongside the pre-existing `mergeGuestRecentSearches` (both run via `Promise.all`).
- Frontend: new `frontend/features/favorites/` — `types.ts`, `hooks/useFavoriteHotelIds.ts` (bulk id-set fetch + optimistic toggle, called once per page and threaded down as props — same lifting pattern as `useSearchCatalogs`), `hooks/useFavoritesList.ts` (full list + local removal, `/favorites` page only), `components/{FavoritesCard,FavoritesPageContent}.tsx`. New `/favorites` route (`app/favorites/page.tsx`).
- Wired up previously-inert UI: `HotelCard.tsx`'s heart toggle (was local `useState` since Feature 09) now takes real `isFavorited`/`onToggleFavorite` props, threaded through both `SearchPageContent` (Grid/List) and `MapView` (sidebar list). Added a matching heart toggle to the hotel-details page header (`HotelDetailsContent.tsx`, beside the `<h1>`). Added a plain Favorites icon link to `Navbar.tsx` (no count badge — that's Compare/Feature 18's job).
- Docs updated: `context/progress-tracker.md` (Completed Features entry, 3 new Architecture Decisions, Session Notes entry, Current Status now pointing at Feature 18 Compare), `context/ui-registry.md` (Navbar/HotelCard entries updated, new FavoritesPageContent/FavoritesCard entry, hotel-details header block updated), `context/architecture.md` (file tree annotations, Guest→Account Merge section updated with the collision-handling note, new "Favorites (Feature 17)" data-flow section).

## Decisions made

- Favorited state on `/search` and hotel-details loads via a bulk `GET /favorites/hotel-ids` id set, cross-referenced client-side — not embedded as an `isFavorited` field on the already-shipped `/search`/`GET /hotels/:id` responses. Confirmed with the developer during `/architect`: avoids touching two previously-reviewed endpoints, same instinct as the Feature 16 rating-consistency call.
- Favorites page shows a real `"from $X/night"` price (`MIN(room_types.base_price)`, no dates) rather than omitting price like `SimilarHotelCard` does — keeps the Favorites Card visually matching the hotel card, per `ui-rules.md`. Confirmed with the developer.
- Toggle is separate `POST`/`DELETE`, not a single toggle endpoint — more conventional REST; `addFavorite` made idempotent server-side instead of trusting the client. Confirmed with the developer.
- Nav Favorites icon has no count badge (unlike Compare, which `ui-rules.md` explicitly calls for one on) — confirmed with the developer.

## Problems solved

- `addFavorite`'s idempotency check initially read `error.code`, which is always `undefined` — node-postgres errors thrown through Drizzle arrive wrapped in `DrizzleQueryError`, with the real pg error (and its `.code`) on `.cause`. Caught via a real duplicate-`POST` curl repro; fixed to check `error.cause?.code`.
- `mergeGuestFavorites`'s naive blind `UPDATE ... WHERE session_token = ...` would throw a unique-constraint violation (`favorites_user_hotel_idx`) if the logging-in account already favorited the same hotel in a prior session. Fixed by wrapping the merge in a transaction that first deletes colliding guest rows (account's existing favorite wins) before re-pointing the rest. Verified directly with a scratch script against a real seeded user row.
- `fromPrice` came back as a JSON string (`"145"`) despite a `sql<number | null>` type hint — Drizzle only auto-casts declared `numeric(mode:"number")` columns, not raw `sql` aggregate fragments. Fixed with an explicit `::float8` cast in the subquery.
- Playwright test false positive: `ViewToggle.tsx` also renders `aria-pressed` buttons above the results grid, so a generic `button[aria-pressed]` selector was clicking the view toggle instead of the favorite heart. Rescoped to `button:has(svg.lucide-heart)`.

## Current state

Feature 17 is fully built, verified, and documented — **uncommitted**. Verified end-to-end: `tsc --noEmit`/`pnpm build` clean (backend), `tsc --noEmit`/`eslint`/`next build` clean (frontend, including the new `/favorites` route), `pnpm seed` unaffected/idempotent, direct `curl` exercised the full add/duplicate-add/list/remove/re-remove flow, a real Playwright pass confirmed the toggle persists across reload, the Favorites page renders/removes correctly with the locked empty state, the hotel-details toggle works independently, and the Navbar icon is present — zero console errors, no horizontal overflow at 390px.

Dev servers were left running: backend :4000, frontend :3000, frontend-admin :5173 — may or may not still be up depending on machine state between sessions.

**Still open from two sessions ago:** the Feature 16 rating-consistency gap (hotel-details header and search/similar-hotel cards read stale `hotels.averageRating`/`reviewCount` instead of live-computed numbers) was raised again at the start of this session but the developer chose to build Favorites instead of deciding on it. It remains unresolved — 3 remediation options were presented in a prior session (see `progress-tracker.md`'s Feature 16 Completed Features entry for the full list: leave as-is until Feature 24, fix just the details header, or fix everywhere).

## Next session starts with

Ask the developer whether to: (a) commit Feature 17, (b) finally resolve the Feature 16 rating-consistency question (carried over twice now), or (c) move straight to Feature 18 — Compare Hotels (compare toggle on hotel cards/favorites cards/hotel details — already inert local UI on `HotelCard.tsx`, same "wire up existing UI" shape Favorites just followed; floating bottom compare tray app-wide once at least one hotel is selected).

## Open questions

- Which of the 3 rating-consistency remediation options (if any) the developer wants — unresolved for two sessions running now.
- Whether to commit the current uncommitted Feature 17 changes — not yet asked this session.
