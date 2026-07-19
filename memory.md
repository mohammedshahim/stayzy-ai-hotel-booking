# Memory — Search Bar on /search + Compare Alignment Fixes (unplanned, between Features 30 and 31)

Last updated: 2026-07-19

## What was built

Unplanned work — none of this is a numbered feature in `build-plan.md`. Feature 31 (Environment Variables) was started via `/architect`, then explicitly parked by the developer before any of it was built.

**New: `frontend/features/search/components/SearchBar.tsx`.** `/search` previously had **no search bar at all** — destination/dates/guests were read-only there, so a user landing on the results page could change filters but not city, dates, or party size without going back to the home page. The new bar hydrates all six core params from the URL, holds edits as draft state, and commits on an explicit Search press. Mounted full-width in `SearchPageContent.tsx` above the sidebar+results row; the now-redundant `in {destination}` text was removed from the results-count line.

Supporting changes:
- `frontend/lib/date.ts` — added `toDateRange()` / `toIsoDates()` bridging `SearchState`'s ISO strings and `DateRangePicker`'s `Date` objects.
- `frontend/features/search/hooks/useSearchState.ts` — exported `DEFAULT_STATE`; added a `{ history: "push" | "replace" }` option to `update()`; added the date-pair invariant to `serializeSearchState`.
- `frontend/features/search/components/HeroSearchWidget.tsx` — now serializes through `serializeSearchState` instead of hand-rolling the same six params.
- `frontend/features/search/components/{DateRangePicker,GuestsRoomsPicker}.tsx` — removed `w-full` from both triggers (see Problems solved).
- `frontend/features/compare/components/CompareTray.tsx` — `flex-1` on the avatars+label group; wrapper now `w-full max-w-3xl sm:w-fit`.
- `frontend/features/compare/components/CompareTable.tsx` — explicit `text-left` on both cell classes.
- `context/ui-registry.md` — new `SearchBar` entry; dated 2026-07-19 notes added to the Hero Search Widget and CompareTray/CompareTable entries.

## Decisions made

- **The URL stays the single source of truth for search state.** The bar hydrates from `useSearchState()` and introduces no store — the existing URL→state plumbing was already correct, and a store would have created a second source of truth.
- **Draft state + explicit Search button**, matching `HeroSearchWidget` and deliberately unlike `FilterSidebar` (which applies on every change). Avoids firing a request mid-date-selection.
- **Draft resync uses React's "adjust state during render" pattern**, keyed on a signature of the six core params — not a `useEffect` (flashes stale values for a frame) and not a `key` prop (would remount the pickers and close open popovers). This is recorded in `ui-registry.md` as a do-not-do.
- **A search submit is `router.push`; filters/sort/view stay `router.replace`.** Opt-in per call via `update(partial, { history: "push" })`.
- **Search bar breaks to a row at `md:`, not `lg:` like `HeroSearchWidget`** — a stacked bar on the results page pushes hotels below the fold in a way it doesn't on a hero. Destination gets `2fr` only at `lg:`; at `md:` all three columns are equal because `2fr` at 768px squeezes dates/guests to ~123px and doubles the bar's height.
- **Mobile collapse is an inline expanding panel, not a sheet/drawer** — no Sheet primitive exists in `components/ui/` and building one was out of scope.
- **`ui-registry.md` entries are prose with dated inline notes, not the `/imprint` skill's table template** — same call as Feature 30; all ~40 existing entries are prose.

## Problems solved

- **`th` defaults to `text-align: center`.** This was the real CompareTable defect: the city/country line rendered centered under a `text-left` hotel name, and the "Hotel" label was centered against left-aligned `td` labels. **Two earlier diagnoses of "unequal column widths" were wrong** — widths measured equal at every hotel count (493/493 at two, 329×3, 256×4). Recorded in `ui-registry.md` so the wrong hypothesis isn't re-derived.
- **`w-full` + `m-2` on a segment box overhangs by 16px.** `DateRangePicker` and `GuestsRoomsPicker` (both `PopoverTrigger`s, needing explicit sizing where `DestinationInput`'s `div` gets stretch for free) each carried `w-full`, which resolves to 100% of the parent *before* margins. Measured 285 vs 301 at 375px. Pre-existing; affected `HeroSearchWidget` and `RoomSelectionSection` too, fixed once in the two shared components.
- **react-day-picker returns `{from: X, to: X}` on the first click in range mode** — a zero-night range, *not* a half-open `to: undefined`. The backend 400s on both (`checkOut must be after checkIn`), and the error surfaced as a dead-end "No hotels match these filters" empty state whose Clear filters button couldn't recover it (dates aren't in `EMPTY_FILTERS`). Guard is now `checkOut > checkIn` in `serializeSearchState` plus a disabled Search button and hint. **An initial `from && !to` guard was dead code** — worth remembering before writing any future date-range validation.
- **`router.replace` silently destroys the back stack.** Search Paris → refine to Tokyo → Back landed on the *home page*, skipping the Paris results.
- A `{/* */}` JSX comment cannot precede the root element inside a `return (` — use a `//` comment above the `return`.

## Current state

All work is complete, verified, and **uncommitted** in the working tree on `main` (developer's standing preference). `tsc --noEmit` and `eslint` clean across `features` and `lib`.

Verified against the real running app (headless Chromium, live dev servers, real seeded data) — not just code reading, after two code-reading-only diagnoses proved wrong this session:
- Geometry measured at 1280/768/375: desktop destination 340→519px, Search button `y=117 h=62` matching fields, all three mobile fields equal at 285px, no horizontal overflow at any width.
- Two-day selection → Search enabled → correct URL; same-day range → Search disabled + hint; same-day deep link → 200 with results (was a 400).
- Home → Paris → Tokyo → Back → returns to Paris results with the bar resynced to "Paris".
- Compare tray hugs content at 1 and 3 hotels; compare table city lines and "Hotel" label left-aligned, column widths unchanged.
- No console errors.

```
 M context/ui-registry.md
 M frontend/features/compare/components/CompareTable.tsx
 M frontend/features/compare/components/CompareTray.tsx
 M frontend/features/search/components/DateRangePicker.tsx
 M frontend/features/search/components/GuestsRoomsPicker.tsx
 M frontend/features/search/components/HeroSearchWidget.tsx
 M frontend/features/search/components/SearchPageContent.tsx
 M frontend/features/search/hooks/useSearchState.ts
 M frontend/lib/date.ts
?? frontend/features/search/components/SearchBar.tsx
```

Also uncommitted and **unrelated to this session's work**: `backend/pnpm-workspace.yaml` and `frontend/pnpm-workspace.yaml` (untracked) plus three modified `pnpm-lock.yaml` files. The workspace files contain only pnpm 10 `allowBuilds:` build-approval records (`esbuild`, `sharp`, `unrs-resolver`) — benign, safe to commit as a chore. They predate this session; provenance unknown.

I restarted the `frontend/` dev server on :3000 mid-session — it was already running when the session began and died partway through testing (cause unknown). It is up now. The backend on :4000 was used read-only.

## Next session starts with

1. **Commit this session's work** — nothing is committed. Suggested split: (a) the two compare alignment fixes, (b) the `w-full` fix in the two shared pickers (stands alone — touches three call sites), (c) the search bar including the push/replace history fix, (d) the `ui-registry.md` update, (e) a separate chore commit for the pnpm workspace/lockfile files.
2. **Update `context/progress-tracker.md`** — this session's work is not logged there at all. It is unplanned work with no feature number; the developer has not said how they want it tracked.
3. Then **Feature 31 — Environment Variables** (first item of Phase 9, Deployment). An `/architect` pass was already started on it and produced a full audit — do not redo it, see Open questions.

## Open questions

- **How to log unplanned work in `progress-tracker.md`** — not yet decided.
- **The compare-tray `sm:w-fit` change is an interpretation, not a confirmed diagnosis.** The developer reported that with one hotel selected "thumbnail and hotel selected text are not justified between"; I could not reproduce any structural difference between the 1- and 2-hotel cases (both render avatars+label left, Compare+X right). The shrink-to-fit change is my best reading of the complaint. One class to revert if wrong.
- **Stale line in `ui-registry.md`'s Hero Search Widget entry**: it still claims the search button has "no `onClick`... does not navigate or call an API yet", false since Feature 06. Flagged to the developer, left unfixed pending their call.
- **Feature 31 audit already done — reuse it.** A full env-var audit was completed before Feature 31 was parked. Key findings: `backend/src/config/env.ts` already validates 24 keys with zod, but defaults `APP_URL`/`ADMIN_APP_URL`/`API_URL` to **localhost** (`env.ts:7-9`), so in production an unset value boots fine and then silently breaks CORS and Better Auth callbacks; neither frontend validates anything (`lib/api-client.ts:3` will `fetch("undefined/...")`); **`frontend/.gitignore:34` uses `.env*`, which ignores `frontend/.env.local.example` itself — that file is untracked, so a fresh clone has no frontend env template**; `NODE_ENV` is read at `backend/src/utils/resolveOwner.ts:24` but is in no schema or example file; no package documents its env setup. Hosting provider still undecided ("will do later"), which is what blocks the "configure in the hosting provider's dashboard" half of the feature.
- **Leftover "Temp User 1" test data in the dev DB** (bookings against Hotel Marais Charme, ~2026-07-13) — flagged across Features 26/27/28/29/30, still not deleted, still awaiting a decision.
- The Feature 16 rating-consistency question — carried over many sessions, likely mostly moot since Feature 24, but never re-verified.
- Whether to retrofit the fetch-error-state pattern onto `HotelsListPage` and other existing admin lists — not blocking, flagged in `ui-registry.md`.
- Whether to retrofit `frontend/`'s `Input` primitive with the `text-foreground` fix applied to `frontend-admin`'s copy in Feature 25 — dormant until a native date input exists in `frontend/`.
- Whether `frontend-admin` will ever need real phone-width support (would require the hamburger/drawer nav deliberately deferred in Feature 30) — a deliberate scope cut, not an oversight.
