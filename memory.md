# Memory — Feature 10 Recent Searches + Search Suggestions (+ post-/review fix)

Last updated: 2026-07-09

## What was built

Backend:
- `backend/src/utils/resolveOwner.ts` + `guestCookie.ts` (new) — resolves a logged-in user id or mints/reads a guest `stayzy_guest_id` cookie. First guest-identity mechanism in the codebase; `cookie-parser` added as a new dependency and wired into `app.ts` (Express doesn't parse cookies without it).
- `backend/src/services/recent-search.service.ts` (new) — `recordSearchIfChanged` (dedups against the owner's most-recent row by `(destination, checkIn, checkOut, adults, kids, rooms)`), `listRecentSearches`, `buildSuggestions`, `mergeGuestRecentSearches`.
- `backend/src/queries/recent-searches.queries.ts` (new) — all Drizzle queries backing the service.
- `backend/src/controllers/recent-searches.controller.ts` + `routes/{recent-searches,search-suggestions}.routes.ts` — `GET /recent-searches` (homepage, last 5) and `GET /search-suggestions?q=` (autocomplete, recent + place matches).
- `backend/src/controllers/search.controller.ts` — `GET /search` now also resolves owner and calls `recordSearchIfChanged` (`Promise.all`'d alongside `searchHotels`, best-effort).
- `backend/src/config/auth.ts` — new `hooks.after` (`createAuthMiddleware`, gated on `ctx.context.newSession`) merges guest `recent_searches` rows to the new user id and clears the guest cookie on login/signup (email/password and Google OAuth both flow through this one hook).
- `backend/src/queries/search.queries.ts` — **bug fix**, see Problems Solved below.

Frontend:
- `features/search/hooks/useSearchSuggestions.ts` (new, debounced + `AbortController`) wired into `DestinationInput.tsx`'s new suggestions dropdown (clock icon = recent, pin icon = place; `onMouseDown` `preventDefault` on options so blur doesn't eat the click).
- `features/recent-searches/` (new sibling feature, same pattern as `trending-destinations/`) — `useRecentSearches.ts` + `RecentSearches.tsx`, renders nothing when history is empty, otherwise up to 5 cards on the homepage that navigate straight to `/search?...` on click.
- `app/page.tsx` — renders `<RecentSearches />` between the hero widget and Trending Destinations.

## Decisions made

- **Recording happens backend-side inside `GET /search` itself**, not via a dedicated "log this search" endpoint — fires identically for the homepage widget, bookmarked URLs, and back-button nav; dedup means sort/filter/pagination changes never spam the table.
- **Guest→account merge is one `hooks.after` in `config/auth.ts`**, not a frontend call after login — covers email/password and Google OAuth identically (OAuth redirects straight to `/` with no custom callback page to hook a client call into). Feature 17 (Favorites) will hook its own merge into this same place rather than adding a second mechanism.
- **Suggestions merge two sources**: owner's own past destinations (recency-ordered, capped 3) + `hotels.city`/`country` matches (capped 5), tagged `"recent"`/`"place"`.

## Problems solved

- **Bug found via `/review` after a developer report** (destination `"Al Khobar, Saudi Arabia"` returned zero results for a hotel that exists): `findCandidateHotels` only matched free-text `destination` against `city` OR `country` individually, but "place" suggestions are formatted as the combined `"City, Country"` string, which substring-matches neither column alone. Fixed with a third `ilike` branch matching the concatenated `city || ', ' || country` form. This also slipped through Feature 10's own end-to-end verification — the Playwright pass checked that navigation to `/search` happened but never checked the result count, and the screenshot from that pass actually showed "0 hotels found" the whole time. **Lesson: assert on the outcome (result count / rendered content), not just that navigation occurred.**
- Stale zero-result rows this bug had written into `recent_searches` (all test data) were deleted from the dev DB.

## Current state

Feature 10 fully built, reviewed, bug-fixed, and re-verified (curl + real headless-browser pass confirming "1 hotel found" for the previously-broken query). `tsc --noEmit` and both `pnpm build`/`next build` clean for backend and frontend. All work committed as 4 separate commits and pushed to `origin/main`:
1. `feat(backend): add recent searches + search suggestions backend`
2. `feat(frontend): add destination suggestions dropdown and recent searches`
3. `fix(backend): match combined "City, Country" destination search strings`
4. `docs: log Feature 10 completion, decisions, and destination-matching fix`

Context docs updated: `progress-tracker.md` (Feature 10 marked complete, 3 `/architect` decisions, the bug-fix entry, Feature 11 flagged as needing a decision since `bookings` doesn't exist until Phase 5), `architecture.md` (new Recent Searches data-flow section, generalized Favorites' guest-merge section into the actual shared `hooks.after` mechanism, destination-matching fix noted), `ui-registry.md` (suggestions dropdown + new Recent Search Card), `code-standards.md` (`cookie-parser` added to approved backend dependencies).

Dev servers were left running (backend :4000, frontend :3000) — may or may not still be up depending on machine state between sessions.

## Next session starts with

Feature 11 — Trending Destinations, per `progress-tracker.md`'s "Next up": a derived query over `bookings` grouped by `hotels.city`, ordered by recent booking volume, cached briefly at the API layer. **Flag before starting**: `bookings` doesn't exist as a populated table until Phase 5 (Booking, Checkout, Payment) — worth a `/architect` check with the developer on whether to stub Feature 11 with a simpler interim ranking (e.g. hotel count per city, or `averageRating`) or defer it until real booking data exists.

## Open questions

None blocking. Pre-existing, unrelated: seeded hotel images use a fake placeholder domain (`images.stayzy.dev`) that doesn't resolve for some entries — the real S3 upload path was already proven working in Feature 08.
