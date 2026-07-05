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
