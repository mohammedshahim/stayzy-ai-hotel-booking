# UI Registry

Living document. Updated after every component is built, in either `frontend/` or `frontend-admin/`. Claude must read this before building any new component and match existing patterns exactly. Never invent new patterns when an existing one can be extended — check `ui-rules.md` first for the prescriptive pattern, then check here for the actual component that already implements it.

No components have been built yet. This file starts as a template plus the patterns already locked in by `ui-tokens.md`/`ui-rules.md`, and grows one entry per component as the build plan progresses.

---

## How to Use This File

Before building any new component:

1. Check if a similar component already exists here.
2. If yes — match its exact classes for background, border, text, padding, radius, and hover states.
3. If no — build it following `ui-rules.md`, then add it here immediately after, noting which app (`frontend/` or `frontend-admin/`) it lives in.

After building any component, Claude updates this file with the component name, file path, app, and its exact Tailwind classes.

---

## Registry Format

```
### ComponentName
File:  frontend/... or frontend-admin/...
App:   frontend | frontend-admin
Last updated: [date]

Wrapper:    [classes]
Header:     [classes]
Body:       [classes]
Text:       [classes]
Interactive:[classes]
Notes:      [any important pattern notes, especially deviations that turned out to be necessary]
```

---

## Components Built

### AuthCard

File: frontend/features/auth/components/AuthCard.tsx
App: frontend
Last updated: 2026-07-04

Wrapper: `flex min-h-screen items-center justify-center bg-base px-6 py-12` (page-level centering)
Card: `w-full max-w-md gap-4 rounded-2xl border border-border-default bg-elevated p-6 shadow-card`
Header: `h1` — `text-xl font-semibold text-text-primary`; optional description — `text-sm text-text-muted`
Text: title `text-xl font-semibold text-text-primary`; description `text-sm text-text-muted`
Interactive: none — static wrapper, children supply all interactivity
Notes: The single shared "centered auth card" used by all 5 auth pages (`/login`, `/signup`, `/verify-email`, `/forgot-password`, `/reset-password`) per `build-plan.md`. Built on the shadcn `Card` primitive (`components/ui/card.tsx`) with a `className` override to match the locked Card pattern exactly, rather than using shadcn's `CardHeader`/`CardContent` sub-components — those carry their own `--card-spacing` CSS-variable padding that would double up with a manual `p-6` override. `max-w-md` (28rem) is specific to this narrow, single-column card — do not assume it for wider content cards (hotel cards, panels).

### Auth Form Layout

File: frontend/features/auth/components/{LoginForm,SignupForm,ForgotPasswordForm,ResetPasswordForm}.tsx
App: frontend
Last updated: 2026-07-04

Wrapper: `<form className="flex flex-col gap-4">`
Field: `<div className="flex flex-col gap-1.5">` wrapping a `Label` + `Input` — matches `ui-rules.md`'s "Form Fields" pattern exactly
Error text: `text-xs text-error`, directly below the last field, above the submit button
Divider (between the email form and Google button): `flex items-center gap-3 text-xs text-text-faint`, with `h-px flex-1 bg-border-default` rules flanking the literal word "or"
Footer link line: `text-center text-sm text-text-muted`, link itself `text-accent-text hover:underline`
Interactive: submit button uses the Primary Button pattern plus `disabled:opacity-70` while submitting, with the label swapped to a present-continuous string (e.g. "Logging in...")
Notes: `GoogleSignInButton` reuses the Secondary Button pattern verbatim (plus `w-full`) — no new button variant was introduced. See the corrected Input pattern below — this was the first real usage of it and it needed a fix.

### Admin AuthCard / Login Form

File: frontend-admin/src/features/auth/components/{AuthCard,LoginForm,LoginPage}.tsx
App: frontend-admin
Last updated: 2026-07-05

Wrapper/Card/Header/Text: identical to `frontend/`'s `AuthCard` and "Auth Form Layout" above, copied verbatim (`components/ui/card.tsx`, `input.tsx`, `label.tsx` ported unchanged into `frontend-admin/src/components/ui/` — both apps share the same `@base-ui/react` primitives and the same token remapping in `index.css`/`globals.css`, so no class changes were needed).
Interactive: submit button uses the Primary Button pattern plus `disabled:opacity-70`, label swapped to "Logging in..." while submitting — same as the user frontend.
Notes: This is `frontend-admin/`'s first real component build. No Google button, no divider, no footer signup link, no forgot-password link — the admin login form is deliberately a subset of the pattern (email/password only, no public sign-up per `build-plan.md` Feature 04). Do not add those elements back without a matching product decision.

### Route Guard (ProtectedRoute)

File: frontend-admin/src/features/auth/components/ProtectedRoute.tsx
App: frontend-admin
Last updated: 2026-07-05

Wrapper (loading state): `flex min-h-screen items-center justify-center bg-base`, text `text-sm text-text-muted`
Notes: New pattern, not a variant of anything in `frontend/` (Next.js's `proxy.ts` checks a cookie with no network call; `frontend-admin/` has no server-rendering layer to do that, so the guard is a React Router layout route wrapping `useGetSessionQuery`, showing this loading state until the query resolves, then either an `<Outlet />` or a `<Navigate>` to `/login`). Reuse this loading-state treatment for any other route-level "waiting on session" moment in `frontend-admin/` rather than inventing a new one.

### Navbar

File: frontend/components/layout/Navbar.tsx
App: frontend
Last updated: 2026-07-12 (Feature 18)

Wrapper: `fixed top-0 z-40 h-16 w-full border-b border-border-default bg-surface px-6`
Content: `mx-auto flex h-full max-w-7xl items-center justify-between`
Logo: `text-lg font-semibold text-text-primary`
Right side: `flex items-center gap-3` — Favorites icon link, `CompareNavIcon`, then `AccountMenu`/login CTA
Favorites icon: plain `<Link href="/favorites" aria-label="Favorites">`, `flex h-9 w-9 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-subtle hover:text-text-secondary`, `HeartIcon` (`h-5 w-5`, `strokeWidth={1.5}`) — no count badge (that's Compare-specific)
Compare icon (`CompareNavIcon`, `features/compare/components/`): same sizing/hover treatment as the Favorites icon but wraps a `ScaleIcon`, plus a count badge — `absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-primary px-1 text-[10px] font-medium leading-none text-white`, only rendered when the selection is non-empty. Client Component (reads `useCompareSelection()` from Context), unlike the rest of the Server Component `Navbar` — same "small client sub-component inside a server shell" pattern `AccountMenu` already established.
CTA (logged out): Primary Button pattern via `render={<Link href="/login" />} nativeButton={false}` on the shadcn `Button` primitive
Notes: Server Component — calls `lib/get-server-session.ts` (forwards the incoming request's `cookie` header directly to the backend's `get-session`, since Server Components can't rely on the browser-only rewrite proxy). Renders `AccountMenu` when a session exists, the Log-in button otherwise. Both the Favorites and Compare icons are unconditional (guests can use both), not gated on login. Compact nav search bar is still not built.

### AccountMenu

File: frontend/components/layout/AccountMenu.tsx
App: frontend
Last updated: 2026-07-05

Trigger: `flex h-9 items-center gap-2 rounded-xl border border-border-default bg-elevated px-3 text-sm text-text-secondary transition-colors hover:border-border-subtle hover:text-text-primary`
Avatar fallback: `flex h-6 w-6 items-center justify-center rounded-full bg-accent-dim text-accent-text` wrapping a `UserIcon`
Menu (Popover content): `w-48 border border-border-default bg-elevated p-1.5 shadow-elevated`
Menu item: `flex h-9 items-center rounded-lg px-2.5 text-sm text-text-secondary transition-colors hover:bg-subtle hover:text-text-primary`
Destructive item (Logout): same sizing, `text-error hover:bg-error-dim`
Notes: Built on the new `Popover`/`PopoverTrigger`/`PopoverContent` primitives (`components/ui/popover.tsx`, `@base-ui/react/popover`-backed). Client Component — only piece of the Navbar that needs interactivity. Calls `authClient.signOut()` then `router.push("/")` + `router.refresh()` so the Server Component Navbar re-checks session state.

### Footer

File: frontend/components/layout/Footer.tsx
App: frontend
Last updated: 2026-07-05

Wrapper: `border-t border-border-default bg-surface`
Content: `mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-[1.5fr_1fr_1fr_1fr]`
Column heading: `text-sm font-medium text-text-primary`
Link: `text-sm text-text-muted transition-colors hover:text-text-secondary`
Copyright bar: `border-t border-border-default px-6 py-5`, text `text-xs text-text-faint`
Notes: Homepage-only per `ui-rules.md` — rendered from `app/page.tsx` directly, not from `app/layout.tsx`. Link targets (`/about`, `/help`, `/legal/terms`, etc.) are placeholders; none of those pages exist yet.

### Hero Search Widget

File: frontend/features/search/components/{HeroSearchWidget,DestinationInput,DateRangePicker,GuestsRoomsPicker}.tsx
App: frontend
Last updated: 2026-07-08 (Feature 10 — DestinationInput suggestions dropdown)

Wrapper: `rounded-2xl border border-border-default bg-surface p-5 shadow-elevated`
Segment row: `flex flex-col lg:flex-row` — no divider lines; each segment is its own bordered box (see below) with its own `m-2` margin creating the visual gap between segments, so a separate `divide-x`/`divide-y` would be redundant (double lines).
Segment box (all three — Destination/Date/Guests alike): `m-2 rounded-xl border border-border-default bg-subtle px-4 py-2.5 transition-colors`, active-state border+ring in `accent-border` — `focus-within:` for the Destination `div` (a real `<input>` inside), `focus-visible:` + `aria-expanded:` for the Date/Guests `PopoverTrigger`s (base-ui sets `aria-expanded="true"` on a trigger while its popover is open, so the box stays highlighted for the whole time it's open, not just the instant it's focused).
Segment label: `text-xs font-medium text-text-muted`
Segment value row: `flex items-center gap-2 text-sm text-text-primary`, leading icon `h-4 w-4 shrink-0 text-text-muted`
Destination input: the inner shadcn `Input` is stripped of its own chrome (`h-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0`) so it blends into the segment box rather than showing a second nested border.
Notes (found across three `/review` passes on Feature 05 — read before changing this widget again): (1) a `hover:bg-subtle`-only treatment with no resting-state box was judged "not properly designed" — a field needs to look like a field before it's touched, not just react when touched. All three segments now get the same border/bg treatment at rest, not just Destination, for visual consistency across the widget. (2) never pair a `hover:border-*`/`hover:bg-*` override with a `focus-within:`/`focus-visible:` override on the same property on the same element — a real user's cursor sits over a field while it's focused (clicking in, or hovering an open popover trigger), so both pseudo-classes are true simultaneously, and whichever utility Tailwind emits later in the generated stylesheet wins, regardless of source order in the `className` string. That silently ate the accent focus-border color here the first time. If hover and focus-within/focus-visible ever both need to touch the same property, verify the winning state with computed styles, not just by eyeballing a screenshot (a screenshot from a real mouse click has both pseudo-classes active at once).
Date popover content: `w-auto border border-border-default bg-elevated p-4 shadow-elevated`, wrapping `components/ui/calendar.tsx` in `mode="range"` `numberOfMonths={2}` — no new custom calendar logic, dates before today disabled via `disabled={{ before: new Date() }}`. Since a post-Feature-19 fix, `dateRange` initializes to `defaultDateRange()` (`frontend/lib/date.ts`, a lazy `useState` initializer) rather than `undefined` — the segment shows a real "[Today] – [Tomorrow]" label at rest instead of the "Add dates" placeholder, and `handleSearch` always carries `checkIn`/`checkOut` into the `/search` URL as a result (previously omitted entirely when the user never touched the picker). `frontend/lib/date.ts` mirrors `backend/src/utils/date.ts`'s `todayIso()`/`tomorrowIso()` exactly — any new date-defaulting need on the frontend should import from there rather than re-deriving today/tomorrow locally.
Guests popover content: `w-64 border border-border-default bg-elevated p-4 shadow-elevated`, one row per Adults/Kids/Rooms — stepper buttons use the Ghost Button (icon-only) pattern exactly, count is a plain centered `text-sm text-text-primary`
Search button: Primary Button pattern, `h-11 w-full ... lg:w-auto`, no `onClick` — per `build-plan.md`, Feature 05's search button holds local state only and does not navigate or call an API yet (no `/search` page exists until Feature 06)
Notes: Adding `react-day-picker` required setting `nativeButton={false}` on any shadcn `Button` rendered as a `<Link>` via the `render` prop (base-ui logs a console warning otherwise, since `Link` renders an `<a>`, not a `<button>`) — same fix applied to the Navbar's Log-in button.
Destination suggestions dropdown (Feature 10): plain absolutely-positioned `<ul>`, not the shadcn `Popover` — the popover primitives (`@base-ui/react/popover`) are trigger-driven (click to open), and this needed to open on focus and stay anchored under a plain `<input>`, so a custom `relative` wrapper + `absolute inset-x-0 top-full z-50 mt-2` list was simpler than fighting the trigger model. Dropdown box: `overflow-hidden rounded-xl border border-border-default bg-elevated py-1 shadow-elevated` (same "elevated surface" recipe as the Date/Guests popover content, for visual consistency even though it isn't the same component). Each row: `flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-text-primary hover:bg-subtle`, leading icon `h-4 w-4 shrink-0 text-text-muted` — `ClockIcon` for a `"recent"`-type suggestion, `MapPinIcon` for `"place"`. Each row's `button` sets `onMouseDown={(e) => e.preventDefault()}` — without it, the input's `onBlur` (which closes the dropdown) fires before the row's `onClick`, and the click never registers.

### Trending Destination Card

File: frontend/features/trending-destinations/components/TrendingDestinations.tsx
App: frontend
Last updated: 2026-07-10 (Feature 11)

Section: `border-y border-border-default bg-surface` wrapping `mx-auto max-w-7xl px-6 py-24` — the only homepage section set off with a bordered/surfaced band rather than sitting flush on the page background (`Recent Search Card`'s section rhythm below matches this section's spacing/heading pattern but explicitly *not* its border/surface treatment). Eyebrow `text-sm text-accent-text` ("Explore"), `h2` `mt-1 text-3xl font-semibold text-text-primary`, subtext `mt-2 max-w-2xl text-sm text-text-muted`.
Grid: `mt-10 grid gap-6 md:grid-cols-4`.
Card: `relative aspect-[3/4] overflow-hidden rounded-2xl bg-elevated`, a `Link` (not a static `div`) to `/search?destination="City, Country"` (matches the Homepage Specific Rules destination-card spec in `ui-rules.md`)
Photo: real S3-hosted `<img>` (`h-full w-full object-cover`, `group-hover:scale-105` transition) — the city's highest-rated hotel's main image, from `GET /trending-destinations`. Falls back to the original centered `MapPinIcon` (`h-10 w-10 text-text-faint strokeWidth={1.5}`) placeholder tile only if a city has no main image.
Scrim + label: `absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4`, city `font-medium text-white`, country `text-xs text-white/70`
Notes: Renders `null` entirely when the endpoint returns no cities (matches `RecentSearches`' "hidden if empty" convention) — same `useState`/`useEffect`/`apiClient.get` hook shape as `useRecentSearches.ts`. Ranked by hotel count per city (real booking volume isn't available until Phase 5) — see `architecture.md`'s Trending Destinations data-flow section. Card itself has no border (unlike `Recent Search Card`'s bordered plain-surface card) — photo-first design relies on the scrim gradient for text contrast instead.

### Recent Search Card

File: frontend/features/recent-searches/components/RecentSearches.tsx
App: frontend
Last updated: 2026-07-08 (Feature 10)

Section: same rhythm as Trending Destinations — `mx-auto max-w-7xl px-6 py-14`, eyebrow `text-sm text-accent-text` + `h2` `mt-1 text-3xl font-semibold text-text-primary`. Placed between the hero widget and Trending Destinations on the homepage — a returning visitor's own history reads as more immediately relevant than global trending.
Grid: `grid gap-4 sm:grid-cols-2 lg:grid-cols-5` (up to 5 cards, never more — matches the backend's cap).
Card: plain `<button>`, not the aspect-ratio photo-card pattern Trending Destinations uses — `flex flex-col gap-2 rounded-2xl border border-border-default bg-surface p-4 text-left`, hover `hover:border-accent-border hover:shadow-accent`. Three stacked rows (destination / date range / guest count), each `flex items-center gap-2 text-xs text-text-muted` (destination row is `text-sm font-medium text-text-primary` instead, as the primary label) with a leading `h-3.5 w-3.5 shrink-0` icon (`h-4 w-4` for the destination row's `MapPinIcon`) — `ClockIcon` for dates, `UsersIcon` for guest count.
Notes: Renders `null` entirely when the owner has no history yet — no empty-state placeholder (confirmed during `/architect`, matches the backend's "hidden if empty" contract). Clicking a card navigates straight to `/search?...` (same param-building pattern as `HeroSearchWidget.handleSearch`), it does not just prefill the hero widget's fields.

### StarRating / GuestRatingBadge / EmptyState / Pagination

File: `frontend/components/common/{StarRating,GuestRatingBadge,EmptyState,Pagination}.tsx`
App: frontend
Last updated: 2026-07-06

Notes: First real usage of `components/common/` (per `architecture.md`'s folder plan — shared, reused-across-features UI, not feature-scoped). Each matches its `ui-rules.md`/pre-approved pattern exactly (Star Rating, Guest Rating Badge, Empty State) with no deviation. `Pagination` is a new pattern not previously locked in: numbered buttons (`h-8 w-8 rounded-xl`), active page uses the same `border-accent-border bg-accent-dim text-accent-text` treatment as the Admin Sidebar's active nav item, prev/next chevrons use the Ghost Button (icon-only) pattern. Returns `null` when `totalPages <= 1`. Built for Feature 06's search results but intentionally generic — reuse as-is for any future paginated list (admin tables, bookings).

### HotelCard

File: `frontend/features/search/components/HotelCard.tsx`
App: frontend
Last updated: 2026-07-12 (Feature 18)

Wrapper: Card pattern, `overflow-hidden`, no padding on the wrapper itself (image needs to bleed to the edges) — `border-accent-border` when `isSelected` (Map view pin sync), `border-border-default` otherwise. Always `flex` (`flex-col` for grid, `flex-row` for list) — required so the body's `flex-1`/`mt-auto` can actually fill a CSS-Grid-stretched card and pin the price/CTA row to a shared bottom edge across a row of cards with differing content heights (missing this was a real bug — see Architecture Decisions).
Grid variant: image `aspect-[4/3] w-full rounded-t-2xl`, body below
List variant (`variant="list"`): image becomes `aspect-[4/3] w-56 sm:w-64 shrink-0 rounded-l-2xl`, body fills the remaining width
Favorite/Compare toggles: `h-8 w-8 rounded-xl bg-elevated/90 backdrop-blur-sm` positioned `absolute right-3 top-3` over the image. **Feature 17** wired the Favorite toggle up for real — `isFavorited`/`onToggleFavorite` are now required props (owned by `useFavoriteHotelIds()`, called once in `SearchPageContent`/`MapView` and threaded down, not fetched per-card) — matching Feature 05's precedent of building real interactivity ahead of the feature that wires it up. **Feature 18** wired the Compare toggle the same way, but reads `useCompareSelection()` (Context) directly inside `HotelCard` itself rather than being threaded as props — unlike Favorites' fetch-backed hook, Compare's Context has no per-fetch cost to worry about, so each card reading it directly is fine. Disabled (`opacity-50`, `cursor-not-allowed`) once the 4-hotel cap is reached, unless the card is already selected (removing always stays available).
Discount badge: **removed in Feature 09** — the real schema has no discount column on `hotels`/`room_types` (Feature 06's mock data invented it for the UI). The general principle it established still stands and is still in use elsewhere: any badge/tag placed directly on a photo uses a **solid** fill + `text-white`, never a `-dim` token (the 10%-opacity dim tokens are for badges on the flat page background — see Booking Status Badges — and read as nearly invisible over an image). See `HotelImagesManager`'s "Main" tag for the still-live example of this rule.
Location row: map-pin icon + `"View on map"` text is a `<button onClick={onLocate}>` — `onLocate` is a **required** prop (not optional) since Feature 09's `/review` fix made every call site (Grid/List via `SearchPageContent`'s `handleLocate`, Map view's own list via `onSelectHotel`) always provide a real handler. Previously this button rendered inert (`onClick={undefined}`) outside Map view, showing a CTA-looking control that did nothing — the fix made it always functional: clicking it from Grid/List now switches `SearchPageContent`'s view state to `"map"` *and* selects that specific hotel (lifted `selectedHotelId` state, not owned by `MapView` anymore — see MapView's entry).
CTA: Secondary Button pattern, `render={<Link href={"/hotels/" + hotel.id} />} nativeButton={false}` — `/hotels/[id]` doesn't exist until Feature 12, same placeholder-link precedent as the Footer
Notes: Takes a `SearchResultHotel` (`features/search/types.ts`) from the real `GET /search` response, not `MockHotel`/`mock-hotels.ts` (deleted in Feature 09). `isSelected` stays optional (only meaningful in Map view); `onLocate` is required on every render path.

### FilterSidebar

File: `frontend/features/search/components/FilterSidebar.tsx`
App: frontend
Last updated: 2026-07-07 (Feature 09)

Wrapper: `w-full rounded-2xl border border-border-default bg-surface p-5 lg:sticky lg:top-20 lg:h-fit lg:w-72 lg:shrink-0` — full-width and non-sticky below `lg` (stacks above results instead of forcing a cramped fixed-width column on mobile/tablet; the `w-72`/`sticky top-20` from `ui-rules.md` only applies at `lg:` and up)
Section: `border-b border-border-default py-4 last:border-0`, title `text-sm font-medium text-text-primary mb-3` — matches `ui-rules.md` exactly, implemented as a local (unexported) `FilterSection` helper
Price range: shadcn/base-ui `Slider` (unmodified from generated output, same token-remapping precedent as `calendar`/`popover`/`checkbox`), fixed `0–500` bounds rather than data-derived min/max, for round numbers. Wrapped in a local `PriceRangeSlider` subcomponent holding its own `useState` for the dragged position — `onValueChange` (fires every drag tick) only updates that local state, `onValueCommitted` (fires once, on release) is what actually calls `onChange`/writes the URL. `FilterSidebar` remounts it via `key={minPrice-maxPrice}` whenever the committed range changes for an external reason (chip removal, Clear filters), so no effect is needed to keep local/committed state in sync. Do not swap this back to firing `onChange` from `onValueChange` — that re-filters the full result set on every pixel of drag and was reported as janky in `/review`.
Checkbox rows: shadcn/base-ui `Checkbox` + label, local `CheckboxRow` helper matches `ui-rules.md`'s `flex items-center gap-2 text-sm text-text-secondary` exactly
Guest rating: implemented as checkboxes but behaves as a single-select threshold (`minGuestRating`) — checking one clears any other, since "9+ Excellent" and "8+ Very Good" are mutually exclusive thresholds, not independent filters
Amenities/Room features/Meals: **Feature 09** switched these from name-strings derived off mock data to real database UUIDs. `FilterSidebar` no longer fetches its own option lists — it takes a `catalogs: SearchCatalogs` prop (`{ amenities, roomFeatures, mealPlans }`, each `{id, name}[]`) fetched once by `SearchPageContent` via `useSearchCatalogs()` and shared with `ActiveFilterChips` (was two independent fetches of the same 3 endpoints before a `/review` fix — see that hook's own note). Checkbox `checked`/`onCheckedChange` key off `option.id`, label renders `option.name`.
Landmarks section: **removed in Feature 09** — no landmarks table in the real schema (Feature 06's mock data invented it). Do not re-add without a real data source.
Notes: All filters are real and client-side (confirmed with the developer during `/architect`) — wired through `useSearchState`/`useSearchResults`, not decorative.

### ActiveFilterChips / SortDropdown / ViewToggle

File: `frontend/features/search/components/{ActiveFilterChips,SortDropdown,ViewToggle}.tsx`
App: frontend
Last updated: 2026-07-07 (Feature 09)

Active filter chip: Skill-Tag/Amenity Chip pattern exactly, trailing `XIcon` (`h-3 w-3 text-accent-text hover:text-text-primary`) — one chip per active filter *value* (each star rating, each amenity, etc.), not one chip per filter *category*
Sort dropdown: plain native `<select>` styled to the Input pattern sizing from `ui-rules.md` (`h-10 rounded-xl border border-border-default bg-subtle`) — deliberately not a custom Popover-based listbox like the Date/Guests pickers, since a native select is simpler and suffices here (no multi-row content needed)
View toggle: segmented icon-button group, `rounded-xl border border-border-default bg-subtle p-1` wrapper, active option gets `bg-elevated text-accent-text shadow-card`, inactive `text-text-muted hover:text-text-secondary`
Amenity/room-feature/meal-plan chip labels: `ActiveFilterChips` takes the same `catalogs: SearchCatalogs` prop as `FilterSidebar` (from `SearchPageContent`, see that entry) and resolves each id to a display name via a local `useMemo`'d `Map` (falls back to the raw id if the catalog hasn't loaded yet). Do not re-introduce a component-local fetch for this — that was the exact duplication a `/review` pass caught (6 requests for 3 endpoints instead of 3).
Notes: All three are thin, purely presentational — they take `value`/`onChange` (plus `catalogs` for `ActiveFilterChips`) and know nothing about `useSearchState` internals.

### MapView

File: `frontend/features/search/components/MapView.tsx`
App: frontend
Last updated: 2026-07-07 (Feature 09 + post-`/review` fix)

Layout: `flex flex-col gap-4 lg:grid lg:grid-cols-[1fr_28rem]` — the `ui-rules.md`-specified `grid-cols-[1fr_28rem]` two-column layout only applies at `lg:` and up; below that, the card list and map stack vertically (map gets a fixed `h-80` instead of the desktop `sticky h-[calc(100vh-6rem)]`) to avoid a ~450px-wide second column overflowing on mobile
Card list column: renders `HotelCard` with `variant="list"`, `isSelected`/`onLocate` wired to `selectedHotelId`/`onSelectHotel` **props**
Map column: `react-map-gl`/`mapbox-gl` (`mapStyle="mapbox://styles/mapbox/light-v11"`), one `Marker` per hotel — a plain `<button>` pin (`rounded-full border-2`, `border-accent-primary bg-accent-primary text-white` when selected, `border-border-default bg-elevated text-accent-primary` otherwise) rather than a Mapbox `Popup`, to keep pin↔card sync to a single boolean instead of managing popup open/close state too
Pan/select sync: a `useEffect` watching the resolved selected id calls `mapRef.current.flyTo(...)` (imperative `MapRef`, not the declarative `viewState` prop) — selecting a card or clicking a pin both funnel through the same `onSelectHotel`, satisfying "selecting a card pans to and highlights its pin, and vice versa" from `ui-rules.md`
**Feature 09 `/review` fix — `selectedHotelId` is no longer local state.** It's now owned by `SearchPageContent` and passed down as `selectedHotelId`/`onSelectHotel` props, so `HotelCard`'s "View on map" button in Grid/List (outside `MapView` entirely) can set it *and* switch to Map view in one action — the two need to share the same piece of state. `MapView` computes an `effectiveSelectedId` internally (falls back to `hotels[0]` if the prop is `null` or points at a hotel no longer in the current result set) rather than trusting the prop blindly.
Notes: Receives already-filtered/sorted `hotels` from `useSearchResults` with pagination bypassed (Map view shows every match at once, per `ui-rules.md`) — `MapView` itself does no filtering/sorting/pagination. `useSearchResults` forces `page: 1` for Map-view requests regardless of whatever page was active in Grid/List (a `/review` fix — Map view has no pagination UI and was silently able to request an empty out-of-range slice otherwise).

### Hotel Details Page (HotelGallery / AmenitiesList / PoliciesSection / HotelDetailsSkeleton)

File: `frontend/features/hotel-details/components/{HotelGallery,AmenitiesList,PoliciesSection,HotelDetailsSkeleton,HotelDetailsContent}.tsx`
App: frontend
Last updated: 2026-07-12 (Feature 18 — compare toggle added to header block)

Page container: `mx-auto max-w-6xl flex flex-col gap-6 px-6 py-8` — grew from `max-w-5xl` (Feature 12/13) to `max-w-6xl` in Feature 14 to fit the new two-column content grid without cramping the main column.
HotelGallery: hero `aspect-[16/9] w-full overflow-hidden rounded-2xl bg-elevated`, thumbnail strip below it (`flex gap-3 overflow-x-auto`, each `h-20 w-28 shrink-0 rounded-xl border-2`) — active thumbnail gets `border-accent-border`, inactive `border-transparent`. Clicking a thumbnail swaps the hero image via local `useState`, no lightbox/modal. No-image fallback is `ImageOffIcon` in a `bg-elevated` tile — a deliberate deviation from Trending Destinations' `MapPinIcon` fallback (that one reads as "place," this one reads as "no photo," and a photo gallery's empty state should say the latter).
Header block (in `HotelDetailsContent`, not its own file, full-width above the content grid): `StarRating`, then a `flex items-start justify-between gap-3` row holding the `h1 text-2xl font-semibold text-text-primary sm:text-3xl` and a `flex shrink-0 gap-2` pair of toggle buttons (`h-10 w-10 rounded-xl border border-border-default bg-elevated text-text-muted`): a favorite toggle (**Feature 17**: filled `HeartIcon` + `text-accent-primary` when favorited, backed by `useFavoriteHotelIds()`) and, next to it, a compare toggle (**Feature 18**: `ScaleIcon` + `text-accent-primary` when selected, backed by `useCompareSelection()`, disabled at the 4-hotel cap unless already selected) — same fill/color treatment as `HotelCard`'s toggles, kept side by side rather than stacked, then a `MapPinIcon`-prefixed address line (`text-sm text-text-muted`, non-interactive — see `LocationMapPanel` below for the real map) + `GuestRatingBadge`/`getGuestRatingLabel` + review count, reused byte-for-byte from `HotelCard`'s exact components, rendered unconditionally regardless of `reviewCount` (matches `HotelCard`'s precedent — do not gate this on review count).
Content grid (Feature 14): `grid gap-8 lg:grid-cols-[1fr_22rem]` below the header, per `ui-rules.md`'s Hotel Details Layout spec. Main column (`flex flex-col gap-6`): description paragraph, `AmenitiesList`, `RoomSelectionSection`, `PoliciesSection`, `SimilarHotelsSection` (Feature 15, appended last — see below; renders nothing when empty). Right rail (`flex flex-col gap-6 lg:sticky lg:top-20 lg:h-fit`): currently holds only `LocationMapPanel`; the booking summary panel `ui-rules.md` also specifies for this rail slots in below it once Feature 19+/21 builds it. Below `lg:`, the grid collapses to a single stacked column (rail renders after the main column, no `sticky`).
AmenitiesList / PoliciesSection: both use the Card pattern exactly (`rounded-2xl border border-border-default bg-elevated p-5 shadow-card`), section heading `text-lg font-semibold text-text-primary`. AmenitiesList is a `grid grid-cols-2 gap-3 sm:grid-cols-3` of `icon (h-4 w-4 text-accent-text) + text-sm text-text-secondary` rows — first real render of `amenities.icon` anywhere in either app (see the new `lib/amenity-icons.ts` icon-slug → lucide-icon lookup, with a `BadgeCheckIcon` fallback for any unmapped slug). PoliciesSection is two `flex items-start gap-3` rows (check-in/out, cancellation), each a `h-5 w-5 text-accent-text` leading icon + `text-sm font-medium text-text-primary` label + `text-sm text-text-secondary` body line.
HotelDetailsSkeleton: first real usage of the locked Loading Skeleton pattern (`animate-pulse rounded-xl bg-subtle`) anywhere in either app — shaped to mirror the real layout exactly (hero rectangle, 4 thumbnail rectangles, heading-width text bars, then one bar per Card section below).
Not-found state: the locked Empty State pattern, `icon={MapPinOffIcon}`, heading "Hotel not found" — rendered in-page (no `not-found.tsx` route file), since the frontend can't currently distinguish a 404 from any other fetch failure through `apiClient`'s response shape.
Notes: Data fetching follows the same `useState`/`useEffect`/`apiClient.get` hook shape as `useSearchResults`/`useTrendingDestinations` (`useHotelDetails.ts`), including the same `forId`-comparison trick `useSearchResults` uses (rather than a synchronous `setState` at the top of the effect) to derive `isLoading` without tripping `react-hooks/set-state-in-effect`.

### LocationMapPanel (Feature 14)

File: `frontend/features/hotel-details/components/LocationMapPanel.tsx`
App: frontend
Last updated: 2026-07-10

First real usage of the Panel pattern (`ui-registry.md`'s locked spec) exactly as documented: `overflow-hidden rounded-2xl border border-border-default bg-surface` outer, header `border-b border-border-default px-5 py-4` with `text-lg font-semibold text-text-primary` "Location" title, body `p-5`. Map itself: `h-64 overflow-hidden rounded-xl border border-border-default` wrapping a `react-map-gl` `Map` (`mapStyle="mapbox://styles/mapbox/light-v11"`, same as search's `MapView`), `zoom: 14`, a single non-clickable `Marker` (same pin styling as `MapView`'s selected-pin state — `rounded-full border-2 border-accent-primary bg-accent-primary text-white`, but always "on" since there's only one hotel). Below the map: a `NavigationIcon` + "Get directions" link (`text-sm font-medium text-accent-text hover:text-accent-hover`), `target="_blank" rel="noopener noreferrer"`, `href` built from `hotel.latitude`/`hotel.longitude` straight to `https://www.google.com/maps/dir/?api=1&destination={lat},{lng}` — no geocoding call, no new dependency.
Notes: No backend change was needed — `GET /hotels/:id` already returned `latitude`/`longitude` (`hotels.queries.ts`'s `HOTEL_COLUMNS`, derived from `hotels.location` via `ST_Y`/`ST_X`) since Feature 12; only `frontend/features/hotel-details/types.ts`'s `HotelDetails` type needed the two fields added. Unlike `MapView`, there's no fly-to/selection state — one hotel, one pin, `initialViewState` set once from props.

### FavoritesPageContent / FavoritesCard (Feature 17)

File: `frontend/features/favorites/components/{FavoritesPageContent,FavoritesCard}.tsx`
App: frontend
Last updated: 2026-07-12 (Feature 18 — compare toggle added)

FavoritesPageContent: `mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8`, `<h1 className="text-2xl font-semibold text-text-primary sm:text-3xl">Favorites</h1>` above a `grid gap-5 sm:grid-cols-2 xl:grid-cols-3` of `FavoritesCard`s — same grid rhythm as `/search`'s Grid view and `SimilarHotelsSection`. Uses the locked `EmptyState` pattern (`icon={HeartIcon}`, heading "No favorites yet", a "Browse hotels" action linking to `/search`) when the list is empty — primary page content, same reasoning as `ReviewsSection`'s empty state, not `SimilarHotelsSection`'s render-nothing precedent.
FavoritesCard: same Card pattern as `HotelCard`/`SimilarHotelCard` (`flex flex-col overflow-hidden rounded-2xl border border-border-default bg-elevated shadow-card`), plus `ring-1 ring-inset ring-accent-border` per `ui-rules.md`'s locked Favorites Card spec — the accent ring, not a border-color swap, keeps the same base Card look while still being unmistakably "Favorites" at a glance. `"Saved on {date}"` caption (`text-xs text-text-muted`, `date-fns` `format(..., "MMM d, yyyy")`) sits directly under the name, same date-fns usage as `ReviewListItem`. Price row shows `"from $X/night"` (`hotel.fromPrice`, an undated floor price — see `architecture.md`'s Feature 17 decision — not omitted the way `SimilarHotelCard` omits price entirely, since `ui-rules.md` calls for "same Card pattern as the hotel card" here). The heart button is always filled/pressed (every card on this page is, by definition, favorited) and acts as remove-from-favorites, not a toggle. **Feature 18** added a compare toggle beside it (same `flex gap-2` pairing as the hotel-details header), backed by `useCompareSelection()`, disabled at the 4-hotel cap unless already selected.
Notes: Backed by `useFavoritesList()` (`frontend/features/favorites/hooks/`) — a separate hook from `useFavoriteHotelIds()` (used by `HotelCard`/hotel-details), since this page needs full card data + local-list removal rather than a bulk id set. Removing a card optimistically drops it from local state and re-inserts (sorted back by `savedAt`) if the `DELETE` fails.

### CompareTray / CompareTable / CompareSearchBox / ComparePageContent (Feature 18)

File: `frontend/features/compare/components/{CompareProvider,CompareTray,CompareTraySpacer,CompareTable,CompareSearchBox,ComparePageContent,CompareNavIcon}.tsx`
App: frontend
Last updated: 2026-07-12

CompareTray: matches the locked Floating Compare Tray pattern exactly (`fixed bottom-4 inset-x-0 mx-auto max-w-3xl`, `bg-surface rounded-2xl border border-border-default shadow-elevated px-5 py-4`). Content: `-space-x-2` overlapping `h-9 w-9 rounded-full border-2 border-surface` thumbnails, `"{n} hotel(s) selected"` text, a Primary Button `render={<Link href="/compare" />}`, then a dismiss `XIcon` button (`clear()`s the whole selection — see `architecture.md`'s Feature 18 decision on why dismiss isn't a purely-visual hide). Mounted once in `app/layout.tsx`, renders `null` when the selection is empty.
CompareTraySpacer: not visual — a `<div className="h-24" />` rendered after `<main>`/before `CompareTray` in `app/layout.tsx`, only when the selection is non-empty, so the page's real scrollable height clears the fixed tray at the bottom (see Architecture Decisions — the tray was found to hide the compare table's last row without this).
CompareNavIcon: see the Navbar entry above.
CompareTable (`/compare` page): real `<table>`, matching `ui-rules.md`'s Compare Table spec — wrapper `overflow-x-auto rounded-2xl border border-border-default bg-surface`, every hotel `<th>`/`<td>` `min-w-[16rem]`, row-label column `sticky left-0 bg-surface`. Header row: hotel photo (`aspect-[4/3]`, an `XIcon` remove button top-right) + name (links to `/hotels/[id]`) + city/country. Body rows: Price (`"from $X/night"`), Rating (`StarRating` + `GuestRatingBadge` + review count), Amenities (Amenity/Skill Tag chips, same as `HotelCard`), Cancellation (same label/body pairing as `PoliciesSection`'s cancellation row: `"Free cancellation"`/`"Cancellation policy"` + the policy text). Reserved AI summary slot below the table: `hidden rounded-2xl border border-border-default bg-elevated p-5` per `ui-rules.md` — static markup only, no logic, until the AI phase.
CompareSearchBox (`/compare` page only): same visual shape as `DestinationInput` (label + icon + input, `absolute` suggestion dropdown below), but backed by `useCompareSuggestions()` against the new `GET /hotels/search-suggestions` endpoint instead of destination suggestions — each suggestion row shows a `h-9 w-9 rounded-lg` thumbnail + name + city/country, selecting one calls `add(hotelId)` directly. Disabled with a "Remove a hotel to add another" placeholder once at the 4-hotel cap.
ComparePageContent (`/compare` page): `mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8`, matching `FavoritesPageContent`'s container. Locked `EmptyState` pattern (`icon={ScaleIcon}`, heading "No hotels to compare yet", a "Browse hotels" action to `/search`) when the selection is empty.
Notes: All backed by `useCompareSelection()` (Context, see `architecture.md`'s "Compare State" data-flow section) and `useCompareHotels(ids)` (shared fetch hook — both the tray and the table call it independently rather than one owning the data and passing it down, since they're not necessarily mounted at the same time).

### SimilarHotelsSection / SimilarHotelCard (Feature 15)

File: `frontend/features/hotel-details/components/{SimilarHotelsSection,SimilarHotelCard}.tsx`
App: frontend
Last updated: 2026-07-11

SimilarHotelsSection: no Card-panel wrapper (unlike `AmenitiesList`/`PoliciesSection`/`RoomSelectionSection`) — just a bare `flex flex-col gap-4` holding a `text-lg font-semibold text-text-primary` "Similar Hotels" heading and a `grid gap-5 sm:grid-cols-2 xl:grid-cols-3` of `SimilarHotelCard`s, matching `/search`'s Grid view spacing exactly. Returns `null` (renders nothing at all) both while loading and when the fetched list is empty — deliberately not the locked Empty State pattern here, since this is supplementary below-the-fold content, not a page's primary content (contrast `RoomSelectionSection`'s empty state, which does use `EmptyState`).
SimilarHotelCard: a trimmed-down `HotelCard`-style grid card — `flex flex-col overflow-hidden rounded-2xl border border-border-default bg-elevated shadow-card`, `aspect-[4/3]` image, `StarRating` + `GuestRatingBadge` + review count row, city/country line. No price, no amenities chips, no favorite/compare toggles, no `onLocate` — the whole card is one `Link` straight to `/hotels/[id]`. Deliberately not a reuse of `HotelCard` (see `architecture.md`'s Feature 15 decision): `HotelCard` requires an `onLocate` prop with no meaning outside `/search`'s map-sync context and is typed to `SearchResultHotel`'s price/room-type fields, which don't exist here without a dates/party-size context.
Notes: `useSimilarHotels.ts` is a simple fetch-on-mount hook (`useHotelDetails.ts`'s exact `forId`-comparison shape) — no re-fetch triggers, since the hotel id is static for the lifetime of the page. Backend ranks results by `ST_Distance` only, no rating factored in — see `architecture.md`'s Feature 15 decisions for why.

### ReviewsSection / RatingBreakdown / ReviewListItem (Feature 16)

File: `frontend/features/reviews/components/{ReviewsSection,RatingBreakdown,ReviewListItem}.tsx`
App: frontend
Last updated: 2026-07-11

ReviewsSection: same Card pattern as `PoliciesSection`/`RoomSelectionSection` (`rounded-2xl border border-border-default bg-elevated p-5 shadow-card`, `text-lg font-semibold text-text-primary` heading "Reviews"), slotted into `HotelDetailsContent` between `PoliciesSection` and `SimilarHotelsSection` — matches `ui-rules.md`'s locked Hotel Details Layout order ("description, amenities, room list, reviews, similar hotels"). Uses the locked Empty State pattern (`icon={MessageSquareIcon}`, heading "No reviews yet") when `reviewCount === 0` — a deliberate contrast with `SimilarHotelsSection`'s render-nothing precedent, since reviews are primary page content, not a supplementary recommendation (same reasoning as `RoomSelectionSection`'s empty state).
RatingBreakdown: `flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8` — average number (`text-3xl font-semibold`) + `StarRating` + review count on the left, a 5-row star histogram on the right (`h-1.5 rounded-full bg-subtle` track, `bg-rating-star` fill sized by percentage — the gold rating token, never the accent color, per `ui-tokens.md`'s rule that ratings stay independent of brand color).
ReviewListItem: `flex items-center gap-3` header row — reviewer avatar (`h-10 w-10 rounded-full object-cover` real image, or a `bg-accent-dim text-accent-text` circle wrapping a `UserIcon` fallback when `reviewerAvatarUrl` is null) + name + formatted date (`date-fns` `format(..., "MMM d, yyyy")`), then `StarRating` + description text. First real usage of a real avatar *image* anywhere in either app — `AccountMenu`'s existing avatar fallback pattern never actually branches on a real `avatarUrl`, it always shows the icon.
Notes: "Load more" (not the shared numbered `Pagination` component) — a `Secondary Button`-pattern button that appends the next page's results to accumulated state via `useHotelReviews.ts` (`frontend/features/reviews/hooks/`), hidden once `page >= totalPages`. `useHotelReviews.ts` uses the same `forId`-comparison shape as `useSimilarHotels.ts`/`useHotelDetails.ts` for its initial fetch's `isLoading` (no synchronous `setState` at the top of the effect — tripped the same `react-hooks/set-state-in-effect` lint rule Feature 12 hit first). Backend computes the rating breakdown/average live from real `reviews` rows, falling back to the hotel's stored `averageRating`/`reviewCount` when a hotel has none yet — see `architecture.md`'s Feature 16 decisions.

### Room Selection (RoomSelectionSection / RoomTypeCard)

File: `frontend/features/hotel-details/components/{RoomSelectionSection,RoomTypeCard}.tsx`
App: frontend
Last updated: 2026-07-12 (Feature 19)

RoomSelectionSection: uses the same Card pattern as `AmenitiesList`/`PoliciesSection` (`rounded-2xl border border-border-default bg-elevated p-5 shadow-card`, `text-lg font-semibold text-text-primary` heading "Choose Your Room"), slotted into `HotelDetailsContent` between `AmenitiesList` and `PoliciesSection`. Date/guest picker row: `flex flex-col gap-3 rounded-xl border border-border-default bg-subtle p-2 sm:flex-row` holding `DateRangePicker`/`GuestsRoomsPicker` reused verbatim (same components, same props) from `features/search/components/` — no new picker was built. Room list dims to `opacity-60` (not a skeleton) while a re-fetch from a date/guest change is in flight, since the page around it is already loaded and a full skeleton flash on every date tweak would be jarring; the initial fetch still resolves fast enough that no separate first-load skeleton was added. Empty state (capacity too small for every room type, or every room type sold out) uses the locked Empty State pattern, `icon={BedDoubleIcon}`, heading "No rooms available".
RoomTypeCard: same list-card anatomy as `HotelCard`'s `variant="list"` (`flex flex-col sm:flex-row overflow-hidden rounded-2xl border border-border-default bg-elevated shadow-card`, image `aspect-[4/3] sm:aspect-square sm:w-48`, `ImageOffIcon` fallback in a `bg-subtle` tile matching `HotelGallery`'s fallback). Capacity/meal-plan/free-cancellation row: `flex flex-wrap gap-3 text-xs text-text-muted`, each a `UsersIcon`/`UtensilsIcon`/`ShieldCheckIcon` (`h-3.5 w-3.5`) + label; free-cancellation reuses `PoliciesSection`'s exact `text-accent-text` icon-and-text treatment rather than a status-badge style (it isn't a booking status, so the Booking Status Badge family doesn't apply here). Room features render as the same tag chips `HotelCard` uses for hotel amenities (`rounded-full border border-accent-border bg-accent-dim px-2.5 py-1 text-xs text-accent-text`). Price/inventory block: `text-xl font-bold text-text-primary` price + `text-xs text-text-muted` remaining-inventory line (`"N rooms left"` or `"Sold out for these dates"`). Sold-out cards get `opacity-60` on the whole card.
Reserve button (live since Feature 19): same Primary Button pattern (`bg-accent-primary hover:bg-accent-hover text-white h-9 px-4 rounded-xl`, `disabled:cursor-not-allowed disabled:opacity-70`) — disabled only while sold out, submitting, or the client session is still resolving; label swaps `"Sold out"` / `"Reserving..."` / `"Reserve"`. `onClick` calls `useReserveRoom.ts`'s `reserve()`: logged out → `router.push` to `/login?returnTo=...&autoReserve=1`; logged in but `emailVerified: false` → `router.push("/verify-email")`; otherwise creates the booking and routes to `/checkout/[bookingId]`. A `text-right text-xs text-error` line below the button surfaces a failed reserve attempt inline (e.g. sold out mid-click).
Notes: `useRoomTypes.ts` follows `useSearchResults`'s exact re-fetch shape (`AbortController` + `forQuery`-comparison `isLoading`, serialized query string as the effect's real dependency key). `HotelCard.tsx` (search results) now reads `checkIn`/`checkOut`/`adults`/`kids`/`rooms` via `useSearchParams()` and appends them to its own details-page link so this section starts pre-filled with whatever the user already searched with — see `architecture.md`'s "Room Selection" data-flow section for the full request chain. It also runs a one-shot `autoReserve` effect on mount (`roomTypeId`/`autoReserve=1` in the URL + a positively-confirmed verified session) that completes the logged-out round trip without a second manual click — see `architecture.md`'s Feature 19 data-flow section.
Date default (post-Feature-19 fix): `toDateRange()`'s still-empty case now returns `defaultDateRange()` (`frontend/lib/date.ts`) instead of `undefined` — the picker itself visibly shows "[Today] – [Tomorrow]" whenever `initialSearch` carried no dates (e.g. landing here from Favorites/Compare, which don't carry a date context), not just an internal fallback used for the booking request. Same pairing as Hero Search Widget's fix above — a date-bearing UI element should never leave the user looking at an ambiguous empty state while a concrete default is silently in effect underneath it.

### Checkout (CheckoutPageContent / CheckoutForm / BookingSummaryCard)

File: `frontend/features/booking/components/{CheckoutPageContent,CheckoutForm,BookingSummaryCard,CheckoutSkeleton}.tsx`, `frontend/features/booking/hooks/usePaymentIntent.ts`, `frontend/lib/stripe-client.ts`
App: frontend
Last updated: 2026-07-12 (Feature 21)

Layout matches `ui-rules.md`'s locked Checkout Layout spec exactly: `grid gap-8 lg:grid-cols-[1fr_20rem]`, main column a Payment panel, right rail (`lg:sticky lg:top-20 lg:h-fit`) the `BookingSummaryCard`. Both panels use the same Panel pattern `LocationMapPanel` established in Feature 14: `overflow-hidden rounded-2xl border border-border-default bg-surface`, header `border-b border-border-default px-5 py-4` + `text-lg font-semibold`, body `p-5`.
Payment panel (real as of Feature 21): `CheckoutForm` renders inside the Panel body slot directly (no extra padding wrapper of its own — its three states each own their spacing). Loading state: a full-bleed `h-48 animate-pulse bg-subtle` block with no `rounded-xl` and no padding — a deliberate variant of the locked Loading Skeleton recipe, not an oversight: it sits flush against the panel's own edges, and the parent Panel's `overflow-hidden rounded-2xl` already clips its corners to match, so a "full-bleed fill" reads correctly without needing its own radius (contrast `CheckoutSkeleton`'s bars below, which float inside padding and do need their own `rounded-2xl`). Error state (payment intent fetch failed): `flex flex-col items-center gap-3 p-10 text-center`, `AlertCircleIcon h-10 w-10 text-error`, `text-sm text-text-muted` message. Real form: Stripe `<Elements>`/`<PaymentElement>` wrapped in `flex flex-col gap-4 p-5`, inline error text `text-xs text-error` below the element, submit button `h-10 rounded-xl bg-accent-primary px-6 font-medium text-white disabled:cursor-not-allowed disabled:opacity-70` (the same oversized CTA classes the pre-Feature-21 placeholder button already used — an established "larger checkout CTA" variant of Primary Button, not a new one).
`usePaymentIntent.ts` fetches `POST /payments/intent` automatically on mount (same `forId`-comparison `isLoading` shape as `useBookingSummary.ts`) — the Payment Element is ready to fill in as soon as the page loads, not gated behind a click, since Feature 20's endpoint is already idempotent. `lib/stripe-client.ts` is a lazy `loadStripe()` singleton, same reasoning as backend's `config/stripe.ts`.
`stripe.confirmPayment()` uses `confirmParams.return_url` (full redirect to `/booking-confirmation/[bookingId]`, see below) rather than `redirect: 'if_required'` — Stripe's own redirect handles 3DS and any redirect-based payment method for free; an inline error on this panel only ever shows for immediate failures (e.g. a declined card), since those never redirect.
BookingSummaryCard: hotel thumbnail (`h-16 w-20 rounded-xl`, `ImageOffIcon` fallback) + name/city,country/room type name, then two `border-t border-border-default pt-4` rows — dates (`date-fns format`, `"MMM d – MMM d, yyyy"`) + guests + rooms, then a nights×rooms line and a bold Total row. No booking-status badge yet — the page only ever shows a freshly-created `pending_payment` booking, so the multi-status `Booking Status Badges` family (`ui-rules.md`) is deferred to Feature 23 (My Bookings), the first place multiple statuses render together. Reused verbatim (same component) on the new confirmed state of `/booking-confirmation/[bookingId]` below.
Route: `app/checkout/[bookingId]/page.tsx` is a thin `async` Server Component — the first real page-level auth guard in the app (`getServerSession()`, `redirect()` to `/login?returnTo=/checkout/[bookingId]` if logged out) — that renders `CheckoutPageContent`, which fetches `GET /bookings/:id` client-side via `useBookingSummary.ts` (same `forId`-comparison shape as `useHotelDetails.ts`) and 404s in-page with the locked Empty State pattern (`icon={SearchXIcon}`, heading "Booking not found") if the booking doesn't exist or isn't owned by the current session — same in-page-404 precedent Feature 12 set, not a `not-found.tsx`.
CheckoutSkeleton: follows the locked Loading Skeleton recipe (`animate-pulse bg-subtle`) shaped to the real two-panel grid rather than a generic block — `grid gap-8 lg:grid-cols-[1fr_20rem]` wrapper (same breakpoint as the real layout) holding one `h-64` bar (Payment panel) and one `h-80` bar (BookingSummaryCard), both `rounded-2xl` to match the real panels' own radius — same "skeleton radius matches the real element's radius" rule `HotelDetailsSkeleton` established in Feature 12.

### Booking Confirmation (BookingConfirmationPageContent)

File: `frontend/features/booking/components/BookingConfirmationPageContent.tsx`, `frontend/features/booking/hooks/usePollBookingStatus.ts`, `frontend/app/booking-confirmation/[bookingId]/page.tsx`
App: frontend
Last updated: 2026-07-12 (Feature 21)

No Panel wrapper — unlike Checkout's two-panel grid, this is a single centered full-page result state (`mx-auto max-w-2xl px-6 py-8` for the confirmed state, `mx-auto flex max-w-2xl flex-col items-center gap-3 px-6 py-24 text-center` for the processing/failure states), since there's only ever one outcome to show at a time, not a form alongside a summary. Confirmed state stacks a `CheckCircle2Icon h-12 w-12 text-success` + `text-2xl font-semibold text-text-primary` heading + `text-sm text-text-muted` subtext above the reused `BookingSummaryCard`, then a Secondary Button below the card. Processing state: `Loader2Icon h-10 w-10 animate-spin text-text-faint` + `text-sm text-text-muted` message — this is a new "full-page spinner" pattern, distinct from the Panel-scoped `Spinner` token (`h-4 w-4 border-2 ... animate-spin`) and from any Loading Skeleton usage, since there's no known layout shape to skeleton yet at this point (the booking's fate is still unresolved). Failure state: `XCircleIcon h-12 w-12 text-error` + `text-xl font-semibold` heading + `text-sm text-text-muted` body + a Secondary Button.
Secondary Button usage here is the hand-specified classes (`h-10 rounded-xl border border-border-default bg-elevated px-6 font-medium text-text-secondary transition-colors hover:border-border-subtle hover:bg-subtle hover:text-text-primary`), same as every other Secondary Button in the app — **not** the shadcn `Button`'s bare `variant="outline"` prop. Caught during this same session's `/imprint` pass: `variant="outline"` resolves to `bg-background` (→ `--bg-base`, the page background) at rest rather than `bg-elevated`, so on a bare page with no surrounding panel it rendered with no visible fill, just a border — a real, visible deviation from every other Secondary Button in the app. Fixed before this entry was written. If a future component reaches for `variant="outline"` for a "secondary" look, replace it with the hand-specified classes instead — the shadcn variant is not calibrated to this project's token set.
`usePollBookingStatus.ts` polls `GET /bookings/:id` every 2s (10 attempts, ~20s) — not a visual pattern, but note for future components: its "not found" branch must `return` out of the poll loop immediately rather than falling through to retry (a bug introduced then caught in this same session — retrying a definitive 404 for the full ~20s window wastes calls and would delay any future "not found" UI unnecessarily).
Notes: Reads `redirect_status` from `useSearchParams()` (Stripe's own redirect query param) to show the failure state immediately without waiting on a poll, when present. `app/booking-confirmation/[bookingId]/page.tsx` wraps the client content in `<Suspense>` (required by `useSearchParams()` to avoid deopting the route's prerendering) — first real usage of `<Suspense>` for this reason anywhere in the app; reuse this exact wrapping if any future page needs `useSearchParams()`.

### AppShell / Sidebar / Topbar

File: `frontend-admin/src/components/layout/{AppShell,Sidebar,Topbar}.tsx`
App: frontend-admin
Last updated: 2026-07-06 (post-`/review` fix)

Sidebar: `sticky top-0` + `h-screen w-60` fixed column, `bg-sidebar border-r border-sidebar-border` (the `--color-sidebar*` tokens from `ui-tokens.md`, not `bg-surface`/`border-border-default`) — nav items `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent`, active item adds `bg-sidebar-accent text-sidebar-accent-foreground`. Matches the exact `ui-rules.md` shell structure (`Sidebar` → `Dashboard, Hotels, Bookings` — `Topbar` — flat content area).
Topbar: `sticky top-0 h-16 bg-surface border-b border-border-default px-4 lg:px-6`, admin email left (`text-sm text-text-muted`), Log out button right (Secondary/Ghost-style, no fixed pattern existed for this so it borrows Secondary Button's text/hover tones without the border).
AppShell: plain flex wrapper — `Sidebar` + a `flex-1` column (`Topbar` then `mx-auto max-w-7xl px-4 py-8 lg:px-6 lg:py-10` content, matching the `frontend-admin` Content Width spec).
Notes: First real build of this shell — `ui-rules.md` had already specified it but nothing existed yet (only a login page). `Dashboard` and `Bookings` nav items render disabled (`text-sidebar-foreground/50`, a `Soon` pill, no `NavLink`) since those routes don't exist until Features 25–27 — only `Hotels` is a real `NavLink`. Wired into `ProtectedRoute.tsx`, wrapping its `<Outlet />`. **`sticky top-0` on the Sidebar is required, not optional** — `h-screen` alone only sets its height, it does not pin it to the viewport. Without `sticky`, any content column taller than the viewport (e.g. the hotel edit form + Photos section) makes the whole page scroll and the sidebar scrolls away with it — caught via developer report post-launch, same treatment `Topbar` already had from the start.

### Hotels Table (HotelsListPage)

File: `frontend-admin/src/features/hotels/components/HotelsListPage.tsx`
App: frontend-admin
Last updated: 2026-07-06

Wrapper: exact "Table Wrapper" pattern (`bg-surface rounded-2xl border border-border-default overflow-hidden`) around the shadcn `Table` primitive.
Header row/cell: exact "Table Header Row"/"Table Header Cell" patterns.
Body row/cell: exact "Table Body Row"/"Table Body Cell" patterns (shadcn's own `TableRow`/`TableCell` defaults were overridden to match, since they ship with generic `hover:bg-muted/50` instead of the locked `hover:bg-elevated`).
Empty state: exact "Empty State" pattern, rendered inside a full-width table cell (`Building2` icon).
Row actions: Ghost Button pattern (`size-8 rounded-xl text-text-muted hover:bg-subtle hover:text-text-secondary`) as the `DropdownMenu` trigger — must keep `variant="ghost"` on the shadcn `Button` (dropping it falls back to the `default` variant's solid `bg-primary`, a real regression caught during manual verification).
Pagination: plain Previous/Next (`h-8 rounded-xl` Secondary-Button-style), not the full numbered `frontend/components/common/Pagination.tsx` pattern — deliberate simplification for a low-traffic admin list. Port the real `Pagination` component here if the admin panel ever needs numbered pages.
Notes: Introduces **Hotel Status Badge**, extending the "Booking Status Badge" family to a new status pair not in the original booking list: `published` → `success` variant, `draft` → `neutral` variant, same exact classes (`inline-flex items-center gap-1.5 rounded-full border border-X/20 bg-X-dim px-2.5 py-1 text-xs font-medium text-X`).

### Hotel Form (HotelFormPage / AmenitiesPicker / HotelImagesManager / HotelLocationPicker)

File: `frontend-admin/src/features/hotels/components/{HotelFormPage,AmenitiesPicker,HotelImagesManager,HotelLocationPicker}.tsx`
App: frontend-admin
Last updated: 2026-07-11 (admin manual location override)

Form fields: exact "Input" pattern (including the corrected `focus-visible:border-accent-border focus-visible:ring-accent-border`, not the primitive's default ring) shared by `Input`/`Textarea`/`Select` trigger via one `INPUT_CLASS` constant.
Buttons: Save = Primary Button pattern, Cancel = Secondary Button pattern, both exact.
AmenitiesPicker: plain checkbox grid (`grid grid-cols-2 gap-3 sm:grid-cols-3`), no card/border — a picker over the existing seeded `amenities` lookup table, not a new pattern.
HotelLocationPicker: edit-mode-only field (`sm:col-span-2`, slotted right after the address fields), rendered only once `form.latitude`/`form.longitude` are populated from the loaded hotel. `h-64 overflow-hidden rounded-xl border border-border-default` map wrapper — identical sizing/border treatment to `frontend/`'s `LocationMapPanel`. Same `react-map-gl` `Map`/`Marker` setup and pin visuals (`mapStyle="mapbox://styles/mapbox/light-v11"`, `rounded-full border-2 border-accent-primary bg-accent-primary text-white shadow-card` pin), but the `Marker` is `draggable` with an `onDragEnd` that calls back up to `HotelFormPage` to update `form.latitude`/`form.longitude` directly — first draggable-marker usage in either app (`LocationMapPanel`'s pin is static). No new map abstraction: this is the same component shape copied into `frontend-admin`, not a shared cross-app map component (the two apps don't share a `components/` tree). First use of `react-map-gl`/`mapbox-gl` in `frontend-admin` — see `code-standards.md`'s dependency list and `VITE_MAPBOX_ACCESS_TOKEN` env var (reuses the same public Mapbox token already shipped in `frontend/`'s bundle).
HotelImagesManager: image tiles `aspect-square rounded-xl border border-border-default bg-subtle`, "Main" tag `rounded-lg bg-accent-primary px-2 py-0.5 text-xs font-medium text-white` (same solid-fill-over-photo treatment as `HotelCard`'s discount badge — `-dim` tokens don't read over a photo). Star/Trash overlay controls are the Ghost Button pattern at `size-8 rounded-xl` (matching `HotelCard`'s Favorite/Compare toggle sizing, since both are small icon controls floating over a photo) with `text-white` in place of the muted-token colors, since they sit on a `bg-black/40` scrim rather than the flat page background — same reasoning as `HotelCard`'s note on photo-overlay controls needing their own treatment. Reordering uses native HTML5 drag events (`draggable`/`onDragStart`/`onDragOver`/`onDrop`) — no drag library, since none is used anywhere else in either app yet.
Notes: Uploads go straight through the backend (`multipart/form-data` → `@aws-sdk/client-s3`), not a presigned direct-to-S3 flow — see `architecture.md`/build decisions for Feature 07. New hotels have no images until the record exists, so `HotelImagesManager` only renders in edit mode; creating a hotel redirects straight to its edit page.
Feature 08 update: the page switched from one long scroll to shadcn `Tabs` (Details / Amenities / Images / Room Types) — see the Room Types entry below. The `<form>` wraps only the Details and Amenities `TabsContent` panels (both commit through the same Save Hotel button); Images and Room Types are separate `TabsContent` siblings outside that form, since `RoomTypeForm` renders its own nested `<form>` per room type and HTML forbids nesting `<form>` elements. Images/Room Types tabs are `disabled` until the hotel exists (create mode).

### Room Types (RoomTypesSection / RoomTypeForm / RoomTypeFeaturesPicker / RoomTypeImagesManager / RateOverrideManager)

File: `frontend-admin/src/features/room-types/components/{RoomTypesSection,RoomTypeForm,RoomTypeFeaturesPicker,RoomTypeImagesManager,RateOverrideManager}.tsx`
App: frontend-admin
Last updated: 2026-07-07

Accordion item (first use of shadcn `Accordion` in either app — generated via `shadcn add accordion`, unmodified from generated output, same token-remapping precedent as `slider`/`checkbox`): `rounded-2xl border border-border-default bg-surface px-6 not-last:mb-3 not-last:border-b-0` — same card language as `Card`/`Panel` (`rounded-2xl` + `border-border-default` + `bg-surface`), just stacked with a gap instead of the primitive's default hairline dividers between items.
Accordion trigger row: `text-base` on `AccordionTrigger`, content is `flex flex-1 items-center justify-between pr-2` — name left (`font-medium text-text-primary`), price/inventory summary right (`text-sm text-text-muted`).
RoomTypesSection: `Accordion multiple`, controlled `value`/`onValueChange` (plain `useState<string[]>`) so a newly-created room type can be auto-expanded on creation. "Add Room Type" trigger is the Primary Button pattern with a `Plus` icon; while adding, it renders as a bare (non-accordion) `rounded-2xl border border-border-default bg-surface p-6` card holding `RoomTypeForm mode="create"`, collapsing once creation succeeds. Delete uses the same Dialog confirm pattern as `HotelsListPage`'s hotel delete, with the Destructive Button pattern for both the row-level "Delete Room Type" action and the dialog's confirm button.
RoomTypeForm: single component for both create and edit (discriminated by a `mode` prop), reusing `HotelFormPage`'s exact `INPUT_CLASS`/field-layout conventions verbatim (same grid, same `flex flex-col gap-1.5` field wrapper). The free-cancellation tri-state (inherit/true/false) is modeled at the UI layer as its own `"inherit" | "yes" | "no"` string union (`toOption`/`fromOption` helpers) since a native boolean control can't represent "inherit" — rendered as a plain `Select`, not a new tri-state widget.
RoomTypeFeaturesPicker / RoomTypeImagesManager: byte-for-byte the same patterns as `AmenitiesPicker`/`HotelImagesManager` (same classes, same drag-to-reorder mechanism), scoped to `roomTypeId` instead of `hotelId` — no new visual pattern introduced.
RateOverrideManager: form fields use the same `INPUT_CLASS` as everywhere else, laid out `grid gap-3 sm:grid-cols-4` (date/date/price/availability); native `<input type="date">` × 2 rather than a calendar popover — this app has no date-range-picker dependency and one wasn't worth adding for an admin-only date range. Existing overrides list as `flex items-center justify-between rounded-xl border border-border-default bg-subtle px-3 py-2 text-sm` rows (same "subtle row" treatment as nothing else yet in this app, but analogous to a table body cell), trailing delete as the Ghost Button pattern with `hover:bg-error-dim hover:text-error` swapped in (a destructive-flavored ghost icon button — new combination, reuse if another list ever needs an inline destructive icon action outside a table). The backend expands a submitted range into one `rate_overrides` row per date and re-groups consecutive same-value dates back into ranges for display (`"2026-12-20 → 2026-12-27"`); delete removes the whole displayed range in one call.
Bug found and fixed while building this: shadcn's `Select` (`@base-ui/react/select`) only resolves `<Select.Value>` to an item's rendered label once base-ui's `items` map is populated, and nothing does that automatically from JSX children — before ever opening the dropdown, the trigger silently showed the raw `value` string instead (e.g. `"inherit"` instead of "Inherit hotel default", `"draft"` instead of "Draft"). Fixed at the primitive, not the call sites: `components/ui/select.tsx`'s `Select` wrapper now derives `items` itself from its `SelectItem` children (see the Input pattern entry below) — every `<Select>` in the app got this fix for free with no per-call-site change needed.

### StarRatingDisplay

File: `frontend-admin/src/components/common/StarRatingDisplay.tsx`
App: frontend-admin
Last updated: 2026-07-06

Wrapper/Filled/Empty: exact "Star Rating" pattern (`inline-flex items-center gap-0.5`; filled `size-4 fill-current text-rating-star`; empty `size-4 text-rating-star-empty`).
Notes: First real usage of `frontend-admin/src/components/common/` (mirrors `frontend/components/common/`'s role — shared, reused-across-features UI). Read-only display only; the hotel form uses a plain `Select` (1–5) for star rating *input* rather than a clickable star widget, since a dropdown is simpler for an admin data-entry form and no interactive star-input pattern exists anywhere in either app.

### My Bookings (BookingsPageContent / BookingListCard / BookingDetailPageContent / CancelBookingSection / BookingStatusBadge)

File: `frontend/features/booking/components/{BookingsPageContent,BookingListCard,BookingDetailPageContent,CancelBookingSection,BookingStatusBadge}.tsx`, `frontend/features/booking/components/BookingSummaryCard.tsx` (updated), `frontend/app/bookings/page.tsx`, `frontend/app/bookings/[id]/page.tsx`
App: frontend
Last updated: 2026-07-13 (Feature 23)

BookingStatusBadge: first real implementation of the "Booking Status Badge" family `ui-rules.md` pre-locked and `BookingSummaryCard` had a slot reserved for since Feature 21 — exact classes per status, no deviation (`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium` + `border-success/20 bg-success-dim text-success` Confirmed / `border-warning/20 bg-warning-dim text-warning` Pending Payment / `border-info/20 bg-info-dim text-info` Completed / `border-neutral/20 bg-neutral-dim text-neutral` Cancelled / `border-error/20 bg-error-dim text-error` Failed). Lives in `features/booking/`, not `components/common/` — unlike `StarRating`/`GuestRatingBadge`/`EmptyState`/`Pagination` (genuinely cross-feature), this badge is only ever meaningful for a booking, so it stays feature-scoped even though it now renders in three places.
BookingSummaryCard (updated): header row changed from a plain heading to `flex items-center justify-between` holding the heading + `BookingStatusBadge` — the deferred slot noted in the Checkout entry above. Reused verbatim on Checkout and Booking Confirmation, so both of those pages now also show a live status badge (Pending Payment / Confirmed respectively) as a side effect of reuse — correct and desired, not a regression.
BookingListCard: same list-row anatomy as `RoomTypeCard` (`flex flex-col overflow-hidden rounded-2xl border border-border-default bg-elevated shadow-card sm:flex-row`, image `aspect-[4/3] sm:aspect-square`, `ImageOffIcon` fallback in a `bg-subtle` tile), sized `sm:w-40` (narrower than `RoomTypeCard`'s `sm:w-48` — this row carries less content). Unlike `RoomTypeCard`, the whole card is one `Link` to `/bookings/[id]` with a `hover:border-border-subtle` transition — same whole-card-clickable precedent as `HotelCard`/`SimilarHotelCard`. Header inside the card is `flex items-start justify-between gap-3`: hotel name/city,country left, `BookingStatusBadge` right — same left-content/right-badge pairing `HotelsListPage`'s table rows use for Hotel Status Badge.
BookingsPageContent: byte-for-byte `FavoritesPageContent`'s page shell (loading text / Empty State / populated branching, `h1 text-2xl font-semibold text-text-primary sm:text-3xl`), narrowed to `max-w-4xl` (vs Favorites' `max-w-6xl`) and listing rows in a `flex flex-col gap-4` stack instead of Favorites' `grid gap-5 sm:grid-cols-2 xl:grid-cols-3` — a list, not a card grid, since each row already carries dates/price/status inline and reads better full-width. Empty state: locked Empty State pattern, `icon={CalendarXIcon}`, heading "No bookings yet", same Secondary-Button-styled "Browse hotels" action `FavoritesPageContent` uses (`render={<Link href="/search" />}` `nativeButton={false}`).
BookingDetailPageContent: single-column `mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8` (narrower than Checkout's `max-w-5xl` two-panel grid — this page stacks a summary card and a cancellation panel, no payment form beside it). 404 branch reuses `CheckoutPageContent`'s exact in-page Empty State precedent (`icon={SearchXIcon}`, heading "Booking not found"). No separate page-header badge — the status badge shown is `BookingSummaryCard`'s own, avoiding a duplicate on the same page.
CancelBookingSection: Card-shell pattern (`rounded-2xl border border-border-default bg-elevated p-5`, same shell as `PoliciesSection`/`AmenitiesList`, no heading — single-purpose action panel, not a content section). Three states gated on `booking.status`/`isCancellable` (both computed server-side, never re-derived client-side): renders nothing for any non-`confirmed` status; a static `text-sm text-text-muted` message when `confirmed` but not cancellable ("This booking is non-refundable and can't be cancelled online."); otherwise the exact locked **Destructive Button** pattern (`border-error/25 bg-error-dim text-error hover:bg-error/20`) as the trigger, which swaps to an inline confirm — `flex gap-2` holding the *same* Destructive Button pattern again for "Yes, cancel booking" beside a plain Secondary Button "No, keep it". Corrected during this same session's `/imprint` pass: the first version invented its own slightly-off dim classes for the trigger (`border-error/20` instead of `/25`, `hover:bg-error-dim/80` instead of `hover:bg-error/20`) and a wholly new solid `bg-error text-white` variant for the confirm step — checking `RoomTypesSection`'s real "Delete Room Type" flow (`frontend-admin/src/features/room-types/components/RoomTypesSection.tsx:105,132`) showed the codebase's only precedent uses the *identical dim classes for both the trigger and the dialog's confirm button*, with no solid-fill destructive variant anywhere. Fixed to match exactly before this entry was written — **there is no solid `bg-error` button anywhere in this app; always use the dim Destructive Button pattern for both the initial trigger and any confirm step.** No dialog/modal library used here (unlike `RoomTypesSection`'s `Dialog`-wrapped confirm) — a lightweight inline-confirm (local `isConfirming` state swapping the panel's content) was used instead, since this is the first user-facing (not admin) destructive action with real consequence; reuse this inline-confirm shape for any future user-facing destructive action before reaching for `window.confirm()` or a new dialog dependency.

### Review Creation (ReviewForm / ReviewPageContent / ReviewEntryPoint / interactive StarRating)

File: `frontend/features/reviews/components/{ReviewForm,ReviewPageContent,ReviewEntryPoint}.tsx`, `frontend/components/common/StarRating.tsx` (updated), `frontend/components/ui/textarea.tsx` (new), `frontend/app/bookings/[id]/review/page.tsx`
App: frontend
Last updated: 2026-07-13 (Feature 24)

StarRating (updated): first real reuse-and-extend of a previously display-only `components/common/` primitive rather than building a second component. Added an optional `onChange` prop — when present, each star renders as a `role="radio"` `<button>` (`aria-checked`, `aria-label="N stars"`) inside a `role="radiogroup"` wrapper, instead of a static `<StarIcon>`. Filled/empty classes are unchanged (`text-rating-star fill-current` / `text-rating-star-empty`) but sized up from the display variant's `h-4 w-4` to `h-6 w-6` for a usable touch/click target — display usage elsewhere is untouched (`onChange` omitted → renders exactly as before). This retroactively corrects `StarRatingDisplay`'s note above ("no interactive star-input pattern exists anywhere in either app") — one now does, in `frontend` only; `frontend-admin` still has no interactive star input and should reuse this shape if one is ever needed there.
Textarea (new): `frontend/components/ui/textarea.tsx` didn't exist yet in the user-facing app — added by copying `frontend-admin/src/components/ui/textarea.tsx` verbatim (same shadcn-style primitive family as `frontend/components/ui/input.tsx`: `border-input`, `focus-visible:ring-ring/50`, `field-sizing-content min-h-16`). Field-level override classes on top of it follow the exact `Input` pattern above (`rounded-xl border-border-default bg-subtle px-3 text-text-primary placeholder:text-text-muted focus-visible:border-accent-border focus-visible:ring-accent-border`), just with `py-2.5 min-h-32` instead of a fixed `h-10`.
ReviewForm: Card-shell pattern (`rounded-2xl border border-border-default bg-surface p-5`), `Label` + `StarRating` (interactive) for rating, `Label` + `Textarea` for description, then the exact **Primary Button** pattern (`h-9 rounded-xl bg-accent-primary px-4 font-medium text-white hover:bg-accent-hover disabled:opacity-70`, `RoomTypeCard`/`LoginForm`'s "Reserve"/"Log in" precedent) for submit, disabled until rating ≥ 1 and description is non-empty. Edit mode (an `existingReview` prop is present) appends a border-top `Delete review` section using the *exact* same inline-confirm Destructive Button pattern `CancelBookingSection` established (`border-error/25 bg-error-dim text-error hover:bg-error/20` trigger → inline `flex gap-2` of the same Destructive Button "Yes, delete review" beside a plain Secondary Button "No, keep it") — third real usage of this shape now, confirms it's the standing pattern for any user-facing destructive confirm, not a one-off.
ReviewPageContent: same page shell/loading/empty-state shape as `BookingDetailPageContent` (`mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8`, `SearchXIcon` Empty State for "booking not found"). Added one new not-eligible-yet state (`ClockIcon`, "This booking can't be reviewed yet") for a booking that exists but isn't `completed` — distinct from the 404 case, since it's a real, actionable state rather than a not-found.
ReviewEntryPoint: button-styled-as-`Link` via Base UI's `render`/`nativeButton={false}` prop, same Secondary Button classes and mechanism `BookingsPageContent`'s "Browse hotels" empty-state action already uses. **Note for future `getByRole` queries/tests**: Base UI's `Button` always reports `role="button"` in the accessibility tree even when `render={<Link .../>}` produces an `<a>` under the hood — query it as a button, not a link.
Problems solved: an `enabled`-gated data-fetch hook (`useOwnReview`, skips fetching the full review when the booking summary already says none exists) had a stale-loading race where flipping `enabled` false→true didn't re-arm the loading flag, so the edit form could mount with stale/empty state before the real fetch resolved. Not a visual pattern, but worth knowing if any other component adopts a similar "skip fetch when caller already knows the answer" optimization — key the loading tracker on `` `${id}:${enabled}` ``, not just `id`.

### Admin Bookings List (BookingsListPage)

File: `frontend-admin/src/features/bookings/components/BookingsListPage.tsx`
App: frontend-admin
Last updated: 2026-07-14 (Feature 25)

Table: reuses the exact "Table Wrapper"/"Table Header Row"/"Table Header Cell"/"Table Body Row"/"Table Body Cell" patterns byte-for-byte, same as `HotelsListPage` — guest (name + email, two-line `flex flex-col`), hotel (`size-10 rounded-lg` thumbnail + name/city,country, same cell shape as `HotelsListPage`'s hotel column), room type, dates, total, status. Empty state: exact locked Empty State pattern (`CalendarRange` icon).
Filter bar (new pattern — first filter UI in `frontend-admin`; `frontend/`'s `FilterSidebar` is a different, sidebar-shaped pattern and not a fit here): `flex flex-wrap items-end gap-4 rounded-2xl border border-border-default bg-surface p-4` wrapper directly above the table, each filter a `flex flex-col gap-1.5` `Label` + control pairing (Status/Hotel as `Select`, Check-in from/to as native `type="date"` `Input`, `w-40`–`w-52`). A Secondary-Button-styled "Clear filters" (`variant="outline"`) renders only when a filter is active, appended at the end of the row. Reuse this bar shape for any future admin list that needs filters.
Status badge: reuses the exact locked **Booking Status Badge** family classes unchanged (Confirmed/Pending Payment/Completed/Cancelled/Failed) — first reuse of that family in `frontend-admin` (previously only built in `frontend`, see "My Bookings" entry above). No new badge variant needed.
Pagination: byte-for-byte `HotelsListPage`'s Previous/Next pattern (`PAGE_SIZE = 20`), not the numbered `Pagination` component.
Error state (added post-`/review`): a second empty-slot branch alongside the "no results" Empty State — same layout/classes, `AlertTriangle` icon in `text-error` instead of `text-text-faint`, heading "Couldn't load bookings". First real fetch-error treatment in either app's list pages — `HotelsListPage` and every other admin table still silently show "no results" on a fetch failure; retrofit this same branch there if that's ever revisited.
Notes: Rows were inert at the time this was built (no link to a detail page) — deliberate, `/bookings/:id` didn't exist until Feature 26. As of Feature 26, rows navigate to `/bookings/:id` (see "Admin Booking Detail" entry below) and the inline `STATUS_BADGE_CLASS`/`STATUS_LABEL` maps were replaced by a real shared `BookingStatusBadge` component. Hotel filter dropdown reuses `useGetHotelsQuery({ page: 1, pageSize: 100 })` rather than a new "list all hotels" endpoint — fine at current seed-data scale, revisit if the hotel count ever approaches 100.
Bug found and fixed while building this (see the Input pattern entry below): the shared `Input` primitive had no explicit text-color class, and Chromium's native `<input type="date">` doesn't reliably inherit `color` the way typed text does — the selected date rendered in the page's own background color, effectively invisible. Fixed at the primitive (`components/ui/input.tsx`), not the call site, the same "fix it where every consumer benefits" precedent `select.tsx`'s items-map fix set — this retroactively also fixes `RateOverrideManager`'s two pre-existing date inputs, which had the identical latent bug.

---

### Admin Booking Detail (BookingDetailPage / BookingStatusBadge / ReallocateBookingSection)

File: `frontend-admin/src/features/bookings/components/BookingDetailPage.tsx` (+ `BookingStatusBadge.tsx`, `ReallocateBookingSection.tsx`)
App: frontend-admin
Last updated: 2026-07-14 (Feature 26)

Layout: `/bookings/:id` — a "← Back to bookings" link, `<h1>` + status badge header row, then a read-only two-column summary card (`rounded-2xl border border-border-default bg-surface p-6`, same shell as every other admin card) covering guest, hotel (thumbnail + name/city,country, same shape as the list page's hotel cell), room type, dates, guests/rooms, total price, booked-on date. A second card below holds action controls, rendered only when `status` is `pending_payment` or `confirmed` — a terminal-status booking (`completed`/`cancelled`/`failed`) shows the summary only, no Actions card at all.
`BookingStatusBadge`: extracted as a real component (5-variant `STATUS_CONFIG` map, identical classes to the locked Booking Status Badge family) — replaces `BookingsListPage`'s previously-inlined `STATUS_BADGE_CLASS`/`STATUS_LABEL` maps from Feature 25. Both list and detail pages now import this one component.
Action confirmation pattern: **`Dialog`** (shadcn, same component `HotelsListPage` uses for "Delete hotel"), not the inline "Are you sure?" block `frontend/`'s `CancelBookingSection` uses — `frontend-admin` already had its own destructive-confirm convention via `Dialog`, so Confirm/Cancel/Reallocate all use one controlled `Dialog` whose title/body/button swap based on which action is pending. This is the app's now-canonical confirm-action pattern for `frontend-admin`; reuse it over the inline-block pattern for any future destructive/stateful admin action.
Status → available actions: `pending_payment` shows Confirm (success-tinted button, `border-success/25 bg-success-dim text-success`) + Cancel (error-tinted); `confirmed` shows Cancel + a `ReallocateBookingSection`. Buttons are conditionally rendered per status rather than disabled, so an invalid action is never clickable in the first place.
`ReallocateBookingSection`: fetches room types for the booking's hotel via the existing `useGetRoomTypesQuery(hotelId)` (Feature 08's hook, first reuse of it outside `RoomTypesSection`), filters out the booking's current room type and any room type too small for the party size (`maxAdults`/`maxKids`), a `Select` + "Reallocate" button opens a second `Dialog` naming both room types before committing — the actual price isn't shown until after the mutation succeeds and the summary card re-renders (no separate preview/quote call, matches the "keep it simple" call made during `/architect`).
Error surfacing: unlike most `frontend-admin` mutations (which just show a generic "Could not X" toast — see `HotelFormPage`/`HotelsListPage`), Confirm/Cancel/Reallocate surface the real backend message (e.g. "Not enough rooms available in the target room type for these dates") via a small inline `extractErrorMessage` helper reading `error.data.error` — duplicated once in `BookingDetailPage.tsx` and once in `ReallocateBookingSection.tsx` rather than extracted to a shared util (only 2 call sites, matches this codebase's "don't abstract until it's reused enough to hurt" precedent).
Row navigation: `BookingsListPage`'s rows are no longer inert — `onClick={() => navigate(`/bookings/${booking.id}`)}` on `TableRow`, `cursor-pointer` added to the row class.

---

## Approved Patterns Locked In Advance

These patterns are pre-approved from `ui-rules.md` and must be used exactly as written until a real component build reveals a reason to adjust them (and this file is updated to reflect that reason). Do not deviate silently.

### Primary Button

```
bg-accent-primary hover:bg-accent-hover text-white font-medium h-9 px-4 rounded-xl transition-colors
```

### Secondary Button

```
bg-elevated hover:bg-subtle border border-border-default hover:border-border-subtle text-text-secondary hover:text-text-primary h-9 px-4 rounded-xl transition-colors
```

### Ghost Button (icon only)

```
hover:bg-subtle text-text-muted hover:text-text-secondary h-8 w-8 rounded-xl transition-colors
```

### Destructive Button

```
bg-error-dim hover:bg-error/20 border border-error/25 text-error h-9 px-4 rounded-xl transition-colors
```

### Success / Confirm Button

```
bg-success-dim hover:bg-success/20 border border-success/25 text-success h-9 px-4 rounded-xl font-medium transition-colors
```

First use: Admin Booking Detail's "Confirm booking" action (Feature 26) — same shape as Destructive Button with `success` swapped for `error`, for actions that move a booking forward (confirm) rather than terminate it (cancel). Reuse for any future positive/affirming admin action button.

### Card

```
bg-elevated rounded-2xl border border-border-default p-5 shadow-card
```

### Panel

```
bg-surface rounded-2xl border border-border-default
Panel header: px-5 py-4 border-b border-border-default
Panel body:   p-5
```

### Input

```
h-10 rounded-xl border-border-default bg-subtle px-3 text-text-primary placeholder:text-text-muted focus-visible:border-accent-border focus-visible:ring-accent-border
```

Corrected 2026-07-04 (first real usage, in `AuthForm` above): the shadcn/base-ui `Input` primitive (`components/ui/input.tsx`) applies its own focus ring via `focus-visible:`, not `focus:` — the originally pre-approved pattern used `focus:` and `ring-1`, which never actually triggers on this primitive. Only override the color (`focus-visible:border-accent-border focus-visible:ring-accent-border`); leave the primitive's own `ring-3`/`outline-none`/`transition-colors` base classes alone rather than re-declaring them.

Fixed 2026-07-07 (bug found building Room Types, see that entry): `<Select.Value>` only resolves an item's label from base-ui's `items` map, and nothing auto-populates that map from JSX children — without it, the trigger shows the raw `value` string until the dropdown has been opened once. First fix attempt asked every call site to pass `items` by hand, which just relocates the same footgun (a call site can still forget it, exactly how this bug happened). Fixed properly instead: `components/ui/select.tsx`'s `Select` wrapper now derives `items` itself by recursively walking its `children` for `SelectItem` elements (`collectItemsFromChildren`) and passes that to `SelectPrimitive.Root`, unless a caller explicitly passes `items` itself. No call site anywhere in the app needs to know this exists — `<Select><SelectContent><SelectItem value="x">Label</SelectItem></SelectContent></Select>` just works correctly now, by construction.

Fixed 2026-07-14 (bug found building Admin Bookings List, `frontend-admin` only — see that entry above): `components/ui/input.tsx`'s base className had no explicit text-color utility, relying on inherited `color` from `body`. That inheritance holds for typed text (`type="text"`/`"email"`/`"password"` all render correctly) but Chromium's native `<input type="date">`/`type="time"` internals don't reliably respect it — the digits rendered in `rgb(251, 246, 239)`, exactly `--bg-base`, i.e. invisible against the page background. Fixed by adding `text-foreground` to the base class (alongside the existing `file:text-foreground`) so the color is asserted on the input itself rather than relied on via inheritance. **`frontend/components/ui/input.tsx` has the identical class string and the identical gap** (verified — no `text-foreground` on its base class either), currently dormant only because `frontend` has no native `type="date"`/`type="time"` input anywhere (its date picker is `DateRangePicker`'s Calendar/Popover, not a native input) — apply the same one-word fix there the moment any native date/time input is ever added to that app.

### Booking Status Badge — Confirmed

```
inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-success-dim text-success border border-success/20
```

### Booking Status Badge — Pending Payment

```
inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-warning-dim text-warning border border-warning/20
```

### Booking Status Badge — Completed

```
inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-info-dim text-info border border-info/20
```

### Booking Status Badge — Cancelled

```
inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-dim text-neutral border border-neutral/20
```

### Booking Status Badge — Failed

```
inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-error-dim text-error border border-error/20
```

### Star Rating

```
Wrapper: inline-flex items-center gap-0.5
Filled:  text-rating-star h-4 w-4 fill-current
Empty:   text-rating-star-empty h-4 w-4
```

Interactive variant (`frontend/components/common/StarRating.tsx`, `onChange` prop — see Review Creation entry above): wrapper adds `role="radiogroup"`, each star is a `role="radio"` `<button>` sized up to `h-6 w-6` instead of `h-4 w-4` for a usable click target. Same filled/empty color classes either way.

### Guest Rating Badge

```
inline-flex items-center gap-1.5 rounded-lg bg-info-dim px-2 py-1
Score: text-sm font-bold text-info
Label: text-xs text-text-secondary
```

### Amenity / Skill Tag

```
inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-accent-dim text-accent-text border border-accent-border
```

### Stat Card

```
bg-elevated rounded-2xl border border-border-default p-5 shadow-card
Number: text-2xl font-bold text-text-primary
Label:  text-xs text-text-muted uppercase tracking-wide mt-1
```

### Table Wrapper

```
bg-surface rounded-2xl border border-border-default overflow-hidden
```

### Table Header Row

```
bg-subtle border-b border-border-default
```

### Table Header Cell

```
px-4 py-3 text-xs text-text-muted uppercase tracking-wide font-medium text-left
```

### Table Body Row

```
border-b border-border-default last:border-0 hover:bg-elevated transition-colors
```

### Table Body Cell

```
px-4 py-3 text-sm text-text-secondary
```

### Empty State

```
flex flex-col items-center justify-center py-16 gap-3
Icon:    h-10 w-10 text-text-faint
Heading: text-base font-medium text-text-muted
Body:    text-sm text-text-faint text-center max-w-xs
```

### Loading Skeleton

```
bg-subtle animate-pulse rounded-xl
```

### Spinner

```
h-4 w-4 border-2 border-accent-border border-t-accent-primary rounded-full animate-spin
```

### Floating Compare Tray

```
fixed bottom-4 inset-x-0 mx-auto max-w-3xl
bg-surface rounded-2xl border border-border-default shadow-elevated px-5 py-4
```
