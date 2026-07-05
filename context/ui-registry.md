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
Error text: `text-xs text-state-error`, directly below the last field, above the submit button
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
Destructive item (Logout): same sizing, `text-state-error hover:bg-state-error-dim`
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
Last updated: 2026-07-05

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

### Trending Destination Card

File: frontend/features/trending-destinations/components/TrendingDestinations.tsx
App: frontend
Last updated: 2026-07-05

Card: `relative aspect-[3/4] overflow-hidden rounded-2xl bg-elevated` (matches the Homepage Specific Rules destination-card spec in `ui-rules.md`)
Placeholder visual: centered `MapPinIcon` (`h-10 w-10 text-text-faint strokeWidth={1.5}`) — no real photography exists yet, this is a stand-in watermark, not a final visual
Scrim + label: `absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4`, city `font-medium text-white`, country `text-xs text-white/70`
Notes: Static hardcoded array of 8 destinations (Feature 11 will replace this with a real ranked-by-bookings endpoint — the component itself, not just its data source, may need revisiting then since it currently has no loading/empty state).

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
bg-state-error-dim hover:bg-state-error/20 border border-state-error/25 text-state-error h-9 px-4 rounded-xl transition-colors
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

### Booking Status Badge — Confirmed

```
inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-state-success-dim text-state-success border border-state-success/20
```

### Booking Status Badge — Pending Payment

```
inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-state-warning-dim text-state-warning border border-state-warning/20
```

### Booking Status Badge — Completed

```
inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-state-info-dim text-state-info border border-state-info/20
```

### Booking Status Badge — Cancelled

```
inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-state-neutral-dim text-state-neutral border border-state-neutral/20
```

### Booking Status Badge — Failed

```
inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-state-error-dim text-state-error border border-state-error/20
```

### Star Rating

```
Wrapper: inline-flex items-center gap-0.5
Filled:  text-rating-star h-4 w-4 fill-current
Empty:   text-rating-star-empty h-4 w-4
```

### Guest Rating Badge

```
inline-flex items-center gap-1.5 rounded-lg bg-state-info-dim px-2 py-1
Score: text-sm font-bold text-state-info
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
