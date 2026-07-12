# Memory — Feature 18 (Compare Hotels)

Last updated: 2026-07-12

## What was built

**Feature 18 — Compare Hotels:**
- Backend: two new public endpoints in `hotels.routes.ts`, both mounted *before* `/:id` (Express would otherwise swallow them as `:id` values) — `GET /hotels/compare?ids=a,b,c` (`hotels.queries.ts`'s `findHotelsForCompare`, published-only, re-sorted server-side in `hotel.service.ts`'s `getHotelsForCompare` to match the requested id order since SQL `IN` doesn't preserve it, silently drops any missing/unpublished/deleted id) and `GET /hotels/search-suggestions?q=&excludeIds=` (`findHotelSearchSuggestions`, `ILIKE` across `name`/`city`/`country`, hotel rows only). New `backend/src/types/compare.schemas.ts` (`ids` capped at 10 as a backend sanity limit — separate from the 4-hotel product cap).
- Frontend: new `frontend/features/compare/` — `components/CompareProvider.tsx` (React Context, mounted once in `app/layout.tsx`, holds only `ids: string[]` synced to `localStorage`, hydrated post-mount via `useEffect` to avoid an SSR hydration mismatch), `hooks/useCompareSelection.ts` (Context consumer: `ids`/`isSelected`/`isFull`/`add`/`remove`/`clear`), `hooks/useCompareHotels.ts` (shared fetch hook, always hits `GET /hotels/compare` fresh — no cached display data anywhere client-side), `hooks/useCompareSuggestions.ts`, `components/{CompareTray,CompareTraySpacer,CompareTable,CompareSearchBox,ComparePageContent,CompareNavIcon}.tsx`. New `/compare` route (`app/compare/page.tsx`).
- Wired up previously-inert UI: `HotelCard.tsx`'s `ScaleIcon` toggle (was local `useState` since Feature 09) now reads/writes the real Context directly (not threaded as props — unlike Favorites, Context has no per-fetch cost). Added a matching toggle to `FavoritesCard.tsx` and the hotel-details header (beside the Favorite heart). Added `CompareNavIcon` (count badge) to `Navbar.tsx`, beside the Favorites icon.
- Docs updated: `context/progress-tracker.md` (Completed Features entry, 3 new Architecture Decisions, Session Notes entry, Current Status now pointing at Feature 19 Booking Creation), `context/ui-registry.md` (Navbar/HotelCard/FavoritesCard/hotel-details-header entries updated, new CompareTray/CompareTable/CompareSearchBox/ComparePageContent entry), `context/architecture.md` (file tree annotations, new "Compare Hotels (Feature 18)" data-flow section).

## Decisions made

- `localStorage` holds bare hotel ids only — never cached name/thumbnail/price. Both the tray and the `/compare` table always fetch fresh from `GET /hotels/compare` for the current selection. Confirmed with the developer during `/architect`, who raised the staleness/discrepancy risk directly (a hotel could be edited or unpublished after being cached).
- Compare state lives in a React Context (`CompareProvider`), not a per-component hook — needed because consumers are topologically scattered (Navbar, search grid, favorites grid, hotel-details header, global tray) in a way prop-threading from one lift point can't reach.
- Capped at 4 hotels — matches `build-plan.md`'s own test scenario, keeps the table's side-by-side-plus-scroll layout usable. Toggles and the search box both disable adding a 5th at the cap (not hidden).
- "Distance from a reference point" (from `project-overview.md`) is dropped from scope — no reliable geo reference exists outside a search-destination context. Price shown as dates-agnostic "from $X/night" (same floor-price approach Favorites uses), since compare page has no shared date context across sources.
- The `/compare` page's own search box matches hotel `name` **or** `city`/`country`, but always returns hotel rows (not a mixed place/hotel list like destination suggestions) — a new endpoint, not a widened existing one.
- Tray dismiss (×) clears the entire selection — `ui-rules.md` defines no separate "hidden but retained" tray state.

## Problems solved

- The fixed-position compare tray was hiding the compare table's last row (Cancellation) when scrolled to the bottom — caught only by a real headless-browser scroll-to-bottom check, not visible from the code. Fixed with `CompareTraySpacer.tsx`, a small client component rendered after `<main>` in `app/layout.tsx` that reserves real (non-fixed) scroll height equal to the tray's footprint whenever the selection is non-empty.
- Three `react-hooks/set-state-in-effect` lint violations surfaced only at `eslint` time (not `tsc`), all from synchronous `setState` calls in early-return effect guard branches. Fixed by masking the empty case at the hook's `return` statement (same pattern `useSearchSuggestions` already used) instead of an eslint-disable, except `CompareProvider`'s localStorage-hydration effect, which got a targeted, commented `eslint-disable` since starting empty-then-hydrating is the correct SSR-safe pattern here (a lazy `useState` initializer would cause a real hydration mismatch).
- `useCompareHotels`'s loading state is derived by comparing the current fetch key against the last-resolved key, rather than an imperative `setIsLoading(true)` at the top of the effect — same lint-safe pattern, but needed a genuinely different structure than the `useSearchSuggestions`-style masking trick since this hook's loading state changes on every id-set change, not just the empty case.
- No project-specific Playwright/browser-launch skill exists yet for this repo (same gap noted in every prior feature's memory) — verification again used an ad hoc Playwright script installed into the scratchpad via `npm install playwright --no-save` (chromium binary was already cached from a prior session).

## Current state

Feature 18 is fully built, verified, and documented — **uncommitted**. Verified end-to-end: `tsc --noEmit`/`pnpm build` clean (backend), `tsc --noEmit`/`eslint`/`next build` clean (frontend, including the new `/compare` route), direct `curl` confirmed id-order preservation/silent-drop/uuid-validation/10-id-cap on the new endpoints and correct exclude-ids behavior on search-suggestions. Real Playwright pass confirmed the full flow: toggle on 2 search-result cards → tray appears with live thumbnails + Navbar badge → `/compare` table renders → page's own search box adds a 3rd hotel → removing one shrinks the table and updates the tray everywhere (including mid-navigation to `/favorites`) → favoriting a hotel then toggling compare on its `FavoritesCard` and separately on its hotel-details header both work → reload persists the selection via `localStorage` → dismiss clears it. Zero console errors throughout, including after the tray-overlap fix was verified with a scroll-to-bottom screenshot.

Dev servers were left running: backend :4000, frontend :3000, frontend-admin :5173 — may or may not still be up depending on machine state between sessions.

**Still open, carried over across multiple sessions now:** the Feature 16 rating-consistency gap (hotel-details header and search/similar-hotel cards read stale `hotels.averageRating`/`reviewCount` instead of live-computed numbers) was not raised or addressed this session at all — the developer went straight into `/architect` for Compare Hotels. 3 remediation options remain unresolved (see `progress-tracker.md`'s Feature 16 Completed Features entry).

## Next session starts with

Ask the developer whether to: (a) commit Feature 18, (b) finally resolve the Feature 16 rating-consistency question (now carried over three sessions running), or (c) move straight to Feature 19 — Booking Creation (Phase 5 start — read `build-plan.md`'s Phase 5 section).

## Open questions

- Which of the 3 rating-consistency remediation options (if any) the developer wants — unresolved for three sessions running now, and wasn't even raised this session.
- Whether to commit the current uncommitted Feature 18 changes — not yet asked this session.
