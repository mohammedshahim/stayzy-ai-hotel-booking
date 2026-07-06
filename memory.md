# Memory — Feature 06 Search Results UI

Last updated: 2026-07-06

## What was built

**`frontend/` `/search` page and supporting feature code:**
- `app/search/page.tsx` — thin Server Component `<Suspense>` wrapper around the Client Component `features/search/components/SearchPageContent.tsx` (composes everything below).
- `features/search/data/mock-hotels.ts` — 27 hardcoded hotels across 5 cities (Paris/Tokyo/New York/London/Rome), shaped to match `architecture.md`'s future `GET /search` response exactly (price, rating, lat/lng, amenities, room type, etc.) so Feature 09 can swap the data source without restructuring consumers. Also exports derived constants (`ALL_AMENITIES`, `ALL_ROOM_FEATURES`, `ALL_MEAL_PLANS`, `ALL_LANDMARKS`, price bounds) computed from the array itself.
- `features/search/types.ts` — `SearchState`/`SortOption`/`ViewMode` types.
- `features/search/hooks/useSearchState.ts` — URL-driven state (destination/dates/guests/every filter/sort/view/page) via `useSearchParams`/`router.replace`. Changing any filter/sort/destination/date/guest field resets `page` to 1; `view`/`page` alone do not.
- `features/search/hooks/useSearchResults.ts` — pure filter → sort → paginate over `MOCK_HOTELS`; Map view bypasses pagination (returns every match).
- `features/search/components/{FilterSidebar,ActiveFilterChips,SortDropdown,ViewToggle,HotelCard,MapView}.tsx` — all real/functional, not decorative. `MapView` uses `react-map-gl`/`mapbox-gl` with pin↔card pan/select sync.
- `components/common/{StarRating,GuestRatingBadge,EmptyState,Pagination}.tsx` — first real usage of `components/common/` (shared, reused-across-features UI per `architecture.md`).
- `components/ui/{checkbox,slider}.tsx` — new shadcn primitives, unmodified from generated output.
- `frontend/features/search/components/HeroSearchWidget.tsx` — Search button now navigates to `/search` with destination/dates/guests serialized into the URL (was a dead button since Feature 05).

**Post-`/review` fixes (same session, after Feature 06 was marked complete):**
- `HotelCard.tsx` wrapper is now always `flex` (`flex-col` grid / `flex-row` list) — fixes price/CTA row not aligning to a shared bottom edge across cards of different heights in the same grid row.
- Discount badge switched from `bg-error-dim` (10%-opacity, invisible over photos) to solid `bg-error` + `text-white`.
- `FilterSidebar.tsx`'s price slider refactored into a `PriceRangeSlider` subcomponent: local `useState` drives the live thumb during drag, `onValueCommitted` (fires once, on release) is what actually writes URL state/re-filters — removes jank from firing on every drag tick. Uses a `key`-based remount (not a `useEffect`) to re-sync when the committed range changes externally, since `eslint-plugin-react-hooks`'s `set-state-in-effect` rule correctly flagged the effect-based first attempt.

## Decisions made

- **All `/search` state lives in the URL**, not local React state — `architecture.md`'s `GET /search` already expects this exact param shape, so Feature 09 mostly swaps "filter the mock array" for "call the backend."
- **`react-map-gl` + `mapbox-gl`** added as new `frontend/` dependencies for Map view — standard declarative wrapper, avoids hand-rolled ref lifecycle.
- **Mock data shaped like the real future API response**, with filter option lists derived from the data itself (not hand-maintained) so they can't drift.
- **Continuous-drag inputs (sliders) should use local-state-plus-commit-event, not fire the expensive side effect on every tick** — this is the general pattern to reuse for any future slider/drag control in this codebase.
- **Any badge placed directly over a photo needs a solid/opaque background** (`bg-error` + `text-white`), not the `-dim` (10%-opacity) token pairing meant for the flat page background.

## Problems solved

- **Second systemic token-doc bug found and fixed** (in addition to Feature 03's border-token bug): `ui-tokens.md`/`ui-rules.md`/`ui-registry.md` documented status colors as `state-success`/`state-error`/etc., but `app/globals.css`'s `@theme inline` block only ever registered `--color-success`/`--color-error`/etc. — no `--color-state-*` key exists, so `state-`-prefixed classes silently compiled to nothing. Fixed all three docs and retrofitted 6 already-shipped files that had it: `frontend/features/auth/components/{ForgotPasswordForm,LoginForm,VerifyEmailStatus,ResetPasswordForm,SignupForm}.tsx` and `frontend/components/layout/AccountMenu.tsx`. Verified via a repo-wide grep — zero remaining `state-`-prefixed occurrences.
- **Playwright test-harness false alarm**: hitting `127.0.0.1:3000` instead of `localhost:3000` silently broke the Next dev server's client router/HMR bridge (Next only allows `localhost` as a same-origin dev client) — looked exactly like an app bug (URL never updated on filter/sort changes) until switching the test URLs to `localhost` resolved it. Not an app issue.
- **Stale dev server**: a frontend dev server left running from a prior session had gone unresponsive (hung, 0% CPU, still `LISTEN`ing but not accepting connections) — killed and restarted it.
- **Mobile responsive overflow**: `FilterSidebar`'s fixed `w-72` and `MapView`'s fixed `grid-cols-[1fr_28rem]` both caused horizontal overflow below `lg:` — both now stack vertically on mobile/tablet (sidebar full-width, map gets `h-80` instead of the desktop sticky full-height column). Toolbar row (result count + sort + view toggle) also gained `flex-wrap` to avoid an awkward 3-line count-text wrap on mobile.

## Current state

Feature 06 is fully built and polished, including the 3 developer-reported post-review fixes (card alignment, discount badge legibility, slider jank). `tsc --noEmit`, `eslint`, and `next build` all clean. Verified end-to-end with Playwright: filters/sort/pagination/empty-state/view-toggle all confirmed via real URL state changes, Map view renders real Mapbox tiles with all 27 pins and working pan/select sync, homepage→search navigation carries destination/dates/guests, no horizontal overflow at mobile/tablet/desktop, price slider confirmed to only commit on release (not mid-drag). `ui-registry.md` and `progress-tracker.md` both fully updated including the post-review fixes. Both dev servers left running (`frontend` :3000, `backend` :4000).

**Uncommitted**: none of this session's work has been committed to git yet — a commit request came in but was interrupted before execution, so the working tree still has everything as unstaged/untracked changes.

## Next session starts with

Two things pending, in order:
1. **Commit this session's work** — the developer asked for it to be committed "with each commit having a proper message" (implying multiple logical commits, not one big one — likely: token-doc bug fix + retrofits as one commit, the Feature 06 build itself as another, the post-review fixes as a third) and then pushed. This was interrupted before it happened — confirm the commit grouping and remote/branch before pushing.
2. **Feature 07 Admin Hotel CRUD** — read `build-plan.md`'s section for it: `frontend-admin/` `/hotels` list, `/hotels/new`, `/hotels/[id]` edit (amenities picker, image upload/reorder with one marked main); backend CRUD endpoints in `backend/src/routes/admin/hotels.routes.ts`; server-side geocoding into `hotels.location`; images to S3.

## Open questions

- None blocking Feature 07. The only open item is finalizing how this session's changes should be split into commits before pushing (see Next Session above) — confirm with the developer before pushing since that's a shared/remote-affecting action.
