# Memory — Feature 05 Homepage UI

Last updated: 2026-07-05

## What was built

**`frontend/` homepage and shared page shell:**
- `app/layout.tsx` — added `<Navbar />` + `<main className="pt-16 min-h-screen bg-base">` per `ui-rules.md`'s Page Structure.
- `app/page.tsx` — hero section (headline, subheadline, hero visual placeholder, `HeroSearchWidget`), `TrendingDestinations`, `Footer`.
- `components/layout/Navbar.tsx` — Server Component, logo + login/account state only (Favorites/Compare icons deliberately deferred to Features 17/18).
- `components/layout/AccountMenu.tsx` — Client Component, Popover-based dropdown (My Bookings/Profile/Logout).
- `components/layout/Footer.tsx` — homepage-only, placeholder Company/Support/Legal links.
- `lib/get-server-session.ts` — forwards the incoming request's `cookie` header directly to the backend's `get-session`, since Server Components can't use the browser-only rewrite proxy from Feature 03.
- `features/search/components/{DestinationInput,DateRangePicker,GuestsRoomsPicker,HeroSearchWidget}.tsx` — interactive hero search widget, local state only (no navigation/API — `/search` doesn't exist until Feature 06).
- `features/trending-destinations/components/TrendingDestinations.tsx` — new feature folder (matches Feature 11's numbered slot), 8 hardcoded destinations.
- `components/ui/{calendar,popover}.tsx` — new shadcn primitives (unmodified from generated output — the project's token remapping already makes them on-brand).
- `code-standards.md`, `ui-rules.md`, `ui-registry.md`, `progress-tracker.md` all updated to match.

## Decisions made

- Added `react-day-picker` + `date-fns` as new approved `frontend/` dependencies (shadcn's `Calendar` primitive) rather than hand-rolling date-range math — confirmed with developer during `/architect`.
- `Navbar` fetches session server-side (`get-server-session.ts`) rather than a client-side `useSession()` hook, to avoid a loading flash — only `AccountMenu` itself is a Client Component.
- All three hero search widget segments (Destination/Date/Guests) now share one visual pattern: `m-2 rounded-xl border border-border-default bg-subtle px-4 py-2.5`, accent-colored border+ring when active. This replaced an earlier per-segment-divider layout (`divide-x`/`divide-y`) after two rounds of developer feedback — see Problems Solved.

## Problems solved

- **Hero dead space (developer-reported):** `min-h-[calc(100svh-4rem)] items-center` on the hero grid, combined with the outer section's `py-14`, produced 313px of empty space above the headline on desktop and awkward gaps above/below on mobile. Fixed by dropping the forced min-height entirely; `ui-rules.md`'s Homepage Specific Rules corrected to match (don't reintroduce `min-h-[calc(100svh-4rem)]` on this grid).
- **Destination field UX (developer-reported, took 3 iterations):** (1) field had zero hover/focus feedback at all — fixed with a hover/focus-within background. (2) That only fixed the *interaction* state, not the *resting* look — developer wanted a real bordered box visible before any interaction (chose this explicitly when asked). (3) While wiring the accent-colored focus border, found a real CSS bug: `hover:border-*` and `focus-within:border-*` on the same element compete when a real cursor rests over a focused field (both pseudo-classes true at once) — Tailwind's stylesheet order, not className source order, decides the winner, and it silently ate the accent color. Fix: don't put hover and focus-within/focus-visible on the same property on one element. Verify with computed styles, not just a screenshot (a real mouse click has both states active simultaneously).
- Base-ui's `Button` needs `nativeButton={false}` when rendered as a `<Link>` via the `render` prop, or it logs a console warning (Link renders an `<a>`, not a `<button>`).

## Current state

Homepage is fully built and polished: Navbar (logged-in and logged-out states both verified with a throwaway account, deleted after), hero with search widget (all 3 segments now visually consistent, bordered boxes, verified accent-focus states with computed styles), Trending Destinations (8 static cards), Footer. `tsc`, `eslint`, and `next build` all clean. Verified responsively at mobile/tablet/desktop via headless Playwright (no chromium-cli available in this environment — used a cached `npx playwright` install directly; no project-specific run skill exists yet for this app, none was created since nothing beyond the standard Next.js dev pattern was needed). Both dev servers left running (`frontend` :3000, `backend` :4000).

## Next session starts with

Feature 06 Search Results UI — read `build-plan.md`'s section for it: `/search` page with sticky filter sidebar (price, star rating, guest rating, amenities, room features, meals, free cancellation, landmarks), active filter chips, sort dropdown, List/Grid/Map view toggle (Map view needs Mapbox — `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` already exists as an empty placeholder in `frontend/.env.local`, needs a real value before Map view can render), hotel card, pagination, empty state. Static/mock hotel data for now — real backend wiring is Feature 09.

## Open questions

- None blocking. Worth reusing the hero search widget's bordered-segment pattern (`m-2 rounded-xl border border-border-default bg-subtle`, accent border+ring when active) for the `/search` filter sidebar's interactive controls, for consistency, if it fits.
