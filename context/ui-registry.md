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
Last updated: 2026-07-05

Wrapper: `fixed top-0 z-40 h-16 w-full border-b border-border-default bg-surface px-6`
Content: `mx-auto flex h-full max-w-7xl items-center justify-between`
Logo: `text-lg font-semibold text-text-primary`
CTA (logged out): Primary Button pattern via `render={<Link href="/login" />} nativeButton={false}` on the shadcn `Button` primitive
Notes: Server Component — calls `lib/get-server-session.ts` (forwards the incoming request's `cookie` header directly to the backend's `get-session`, since Server Components can't rely on the browser-only rewrite proxy). Renders `AccountMenu` when a session exists, the Log-in button otherwise. Scope for Feature 05 is logo + login/account state only, per `build-plan.md` — no Favorites/Compare icons or compact search bar yet (those arrive with Features 17/18, which also need to decide how the compact nav search bar hides itself on the homepage).

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
Date popover content: `w-auto border border-border-default bg-elevated p-4 shadow-elevated`, wrapping `components/ui/calendar.tsx` in `mode="range"` `numberOfMonths={2}` — no new custom calendar logic, dates before today disabled via `disabled={{ before: new Date() }}`
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
Last updated: 2026-07-07 (Feature 09 + post-`/review` fix)

Wrapper: Card pattern, `overflow-hidden`, no padding on the wrapper itself (image needs to bleed to the edges) — `border-accent-border` when `isSelected` (Map view pin sync), `border-border-default` otherwise. Always `flex` (`flex-col` for grid, `flex-row` for list) — required so the body's `flex-1`/`mt-auto` can actually fill a CSS-Grid-stretched card and pin the price/CTA row to a shared bottom edge across a row of cards with differing content heights (missing this was a real bug — see Architecture Decisions).
Grid variant: image `aspect-[4/3] w-full rounded-t-2xl`, body below
List variant (`variant="list"`): image becomes `aspect-[4/3] w-56 sm:w-64 shrink-0 rounded-l-2xl`, body fills the remaining width
Favorite/Compare toggles: `h-8 w-8 rounded-xl bg-elevated/90 backdrop-blur-sm` positioned `absolute right-3 top-3` over the image — local component state only (`useState`, no persistence), matching Feature 05's precedent of building real interactivity ahead of the feature that wires it up for real (Favorites/Compare land in Features 17/18)
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
Last updated: 2026-07-10

Page container: `mx-auto max-w-5xl flex flex-col gap-6 px-6 py-8` — narrower than `SearchPageContent`'s `max-w-7xl` (this is a single-column reading layout, not a sidebar+results layout).
HotelGallery: hero `aspect-[16/9] w-full overflow-hidden rounded-2xl bg-elevated`, thumbnail strip below it (`flex gap-3 overflow-x-auto`, each `h-20 w-28 shrink-0 rounded-xl border-2`) — active thumbnail gets `border-accent-border`, inactive `border-transparent`. Clicking a thumbnail swaps the hero image via local `useState`, no lightbox/modal. No-image fallback is `ImageOffIcon` in a `bg-elevated` tile — a deliberate deviation from Trending Destinations' `MapPinIcon` fallback (that one reads as "place," this one reads as "no photo," and a photo gallery's empty state should say the latter).
AmenitiesList / PoliciesSection: both use the Card pattern exactly (`rounded-2xl border border-border-default bg-elevated p-5 shadow-card`), section heading `text-lg font-semibold text-text-primary`. AmenitiesList is a `grid grid-cols-2 gap-3 sm:grid-cols-3` of `icon (h-4 w-4 text-accent-text) + text-sm text-text-secondary` rows — first real render of `amenities.icon` anywhere in either app (see the new `lib/amenity-icons.ts` icon-slug → lucide-icon lookup, with a `BadgeCheckIcon` fallback for any unmapped slug). PoliciesSection is two `flex items-start gap-3` rows (check-in/out, cancellation), each a `h-5 w-5 text-accent-text` leading icon + `text-sm font-medium text-text-primary` label + `text-sm text-text-secondary` body line.
HotelDetailsSkeleton: first real usage of the locked Loading Skeleton pattern (`animate-pulse rounded-xl bg-subtle`) anywhere in either app — shaped to mirror the real layout exactly (hero rectangle, 4 thumbnail rectangles, heading-width text bars, then one bar per Card section below).
Header block (in `HotelDetailsContent`, not its own file): `StarRating` + `h1 text-2xl font-semibold text-text-primary sm:text-3xl` + a `MapPinIcon`-prefixed address line (`text-sm text-text-muted`, non-interactive — no map yet, that's Feature 14) + `GuestRatingBadge`/`getGuestRatingLabel` + review count, all reused byte-for-byte from `HotelCard`'s exact components, rendered unconditionally regardless of `reviewCount` (matches `HotelCard`'s precedent — do not gate this on review count).
Not-found state: the locked Empty State pattern, `icon={MapPinOffIcon}`, heading "Hotel not found" — rendered in-page (no `not-found.tsx` route file), since the frontend can't currently distinguish a 404 from any other fetch failure through `apiClient`'s response shape.
Notes: Data fetching follows the same `useState`/`useEffect`/`apiClient.get` hook shape as `useSearchResults`/`useTrendingDestinations` (`useHotelDetails.ts`), including the same `forId`-comparison trick `useSearchResults` uses (rather than a synchronous `setState` at the top of the effect) to derive `isLoading` without tripping `react-hooks/set-state-in-effect`.

### Room Selection (RoomSelectionSection / RoomTypeCard)

File: `frontend/features/hotel-details/components/{RoomSelectionSection,RoomTypeCard}.tsx`
App: frontend
Last updated: 2026-07-10 (Feature 13)

RoomSelectionSection: uses the same Card pattern as `AmenitiesList`/`PoliciesSection` (`rounded-2xl border border-border-default bg-elevated p-5 shadow-card`, `text-lg font-semibold text-text-primary` heading "Choose Your Room"), slotted into `HotelDetailsContent` between `AmenitiesList` and `PoliciesSection`. Date/guest picker row: `flex flex-col gap-3 rounded-xl border border-border-default bg-subtle p-2 sm:flex-row` holding `DateRangePicker`/`GuestsRoomsPicker` reused verbatim (same components, same props) from `features/search/components/` — no new picker was built. Room list dims to `opacity-60` (not a skeleton) while a re-fetch from a date/guest change is in flight, since the page around it is already loaded and a full skeleton flash on every date tweak would be jarring; the initial fetch still resolves fast enough that no separate first-load skeleton was added. Empty state (capacity too small for every room type, or every room type sold out) uses the locked Empty State pattern, `icon={BedDoubleIcon}`, heading "No rooms available".
RoomTypeCard: same list-card anatomy as `HotelCard`'s `variant="list"` (`flex flex-col sm:flex-row overflow-hidden rounded-2xl border border-border-default bg-elevated shadow-card`, image `aspect-[4/3] sm:aspect-square sm:w-48`, `ImageOffIcon` fallback in a `bg-subtle` tile matching `HotelGallery`'s fallback). Capacity/meal-plan/free-cancellation row: `flex flex-wrap gap-3 text-xs text-text-muted`, each a `UsersIcon`/`UtensilsIcon`/`ShieldCheckIcon` (`h-3.5 w-3.5`) + label; free-cancellation reuses `PoliciesSection`'s exact `text-accent-text` icon-and-text treatment rather than a status-badge style (it isn't a booking status, so the Booking Status Badge family doesn't apply here). Room features render as the same tag chips `HotelCard` uses for hotel amenities (`rounded-full border border-accent-border bg-accent-dim px-2.5 py-1 text-xs text-accent-text`). Price/inventory block: `text-xl font-bold text-text-primary` price + `text-xs text-text-muted` remaining-inventory line (`"N rooms left"` or `"Sold out for these dates"`). Sold-out cards get `opacity-60` on the whole card.
Reserve button: Primary Button pattern (`bg-accent-primary hover:bg-accent-hover text-white h-9 px-4 rounded-xl`) plus `disabled:cursor-not-allowed disabled:opacity-70` — **always disabled**, label swaps `"Coming soon"` (available) / `"Sold out"` (no inventory for the dates). Not hidden, not wired to a route — `POST /bookings` doesn't exist until Feature 19; this is the one call site Feature 19 needs to update.
Notes: `useRoomTypes.ts` follows `useSearchResults`'s exact re-fetch shape (`AbortController` + `forQuery`-comparison `isLoading`, serialized query string as the effect's real dependency key). `HotelCard.tsx` (search results) now reads `checkIn`/`checkOut`/`adults`/`kids`/`rooms` via `useSearchParams()` and appends them to its own details-page link so this section starts pre-filled with whatever the user already searched with — see `architecture.md`'s "Room Selection" data-flow section for the full request chain.

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

### Hotel Form (HotelFormPage / AmenitiesPicker / HotelImagesManager)

File: `frontend-admin/src/features/hotels/components/{HotelFormPage,AmenitiesPicker,HotelImagesManager}.tsx`
App: frontend-admin
Last updated: 2026-07-06

Form fields: exact "Input" pattern (including the corrected `focus-visible:border-accent-border focus-visible:ring-accent-border`, not the primitive's default ring) shared by `Input`/`Textarea`/`Select` trigger via one `INPUT_CLASS` constant.
Buttons: Save = Primary Button pattern, Cancel = Secondary Button pattern, both exact.
AmenitiesPicker: plain checkbox grid (`grid grid-cols-2 gap-3 sm:grid-cols-3`), no card/border — a picker over the existing seeded `amenities` lookup table, not a new pattern.
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
