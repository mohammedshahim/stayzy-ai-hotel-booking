# UI Rules

How to use the tokens defined in `ui-tokens.md`. These are prescriptive rules — not suggestions. Claude must follow them for every component in every session, in both `frontend/` and `frontend-admin/`.

---

## Non-Negotiable Rules

- Never use hardcoded hex values anywhere in JSX or CSS
- Never use raw Tailwind color classes — no `orange-*`, `amber-*`, `red-*`, `gray-*`, `slate-*`, etc.
- Never use dark mode classes or dark mode variants — this product is light mode only
- Always use the CSS variable token classes defined in `ui-tokens.md`
- Always check `ui-registry.md` before building any new component — match existing patterns exactly
- Always use shadcn/ui components from `components/ui/` before building anything custom
- Never invent new patterns — extend existing ones
- Never put UI cards inside other cards
- Never wrap an entire page in a decorative card when a flat page section will do
- Star ratings always use `rating-star` / `rating-star-empty` — never the accent color

---

## Layout

### Page Structure — `frontend/` (public + authenticated user pages)

There is no authenticated sidebar shell on the user side — every page, logged in or not, uses the same public shell:

```
<html> bg-base
  <body> font-sans antialiased text-primary
    <Navbar /> fixed top-0 h-16 w-full
    <main> pt-16 min-h-screen bg-base
      {page content}
    </main>
    <Footer /> (homepage + marketing-style pages only)
```

`/search`, `/hotels/[id]`, `/checkout/[bookingId]`, `/bookings`, and `/bookings/[id]` do not render the footer — they're task-focused pages, not marketing pages.

### Page Structure — `frontend-admin/` (fully authenticated)

```
<AppShell>
  <Sidebar />                      → Dashboard, Hotels, Bookings
  <div> bg-base min-h-screen
    <Topbar /> sticky top-0 h-16 bg-surface border-b border-border-default
    <div> max-w-7xl mx-auto px-4 py-8 lg:px-6 lg:py-10
      {page content}
```

Do not add a second nav bar inside admin pages. Page content starts with a flat page header inside the shell content area, same header pattern as the user frontend.

### Content Width

```
Max content width (frontend):        max-w-7xl mx-auto px-6
Max content width (frontend-admin):  max-w-7xl mx-auto px-4 py-8 lg:px-6 lg:py-10
Search page:                         filter sidebar w-72 fixed/sticky + flexible results column
Cards and panels:                    no fixed width — flex or grid driven
```

### Navbar (`frontend/`)

```
Background:   bg-surface border-b border-border-default
Height:       h-16
Padding:      px-6
Logo:         left aligned, text-primary font-semibold
Search entry: compact search bar, center-aligned, visible on all pages except the homepage hero
Nav links:    right aligned — Favorites icon, Compare icon (badge shows count), account menu
CTA/account:  right aligned, primary button style when logged out ("Log in")
```

### Compare Tray (floating, app-wide)

```
Position:     fixed bottom-4 inset-x-0, centered, max-w-3xl mx-auto
Wrapper:      bg-surface rounded-2xl border border-border-default shadow-elevated px-5 py-4
Content:      flex items-center gap-3 — thumbnail stack + "N hotels selected" + Compare button + dismiss (x)
Visibility:   renders only when compareSelection.length >= 1; hidden entirely otherwise
Persistence:  client-side state (local storage), rehydrated on every page load
```

### Admin Sidebar

```
Sidebar:      w-64 border-r border-border-default bg-surface
Nav item:     h-10 rounded-xl px-3 text-text-secondary hover:bg-subtle hover:text-text-primary
Active item:  border border-accent-border bg-accent-dim text-accent-text
Footer item:  account/logout, h-9 rounded-xl border border-border-default bg-elevated px-3
```

---

## Component Patterns

### Page Headers

Used at the top of every non-homepage page in both apps.

```
Wrapper:  no background, no border, no card
Eyebrow:  text-sm text-accent-text
Title:    mt-1 text-3xl font-semibold text-text-primary
Body:     mt-2 max-w-2xl text-sm text-text-muted
Spacing:  followed by grid gap-6 or section spacing
```

### Cards

Used for hotel cards, favorite cards, compare cards, stat cards, and any repeated item.

```
bg-elevated rounded-2xl border border-border-default p-5 shadow-card
Hover state (if interactive): hover:border-border-subtle hover:shadow-elevated transition-colors
```

Never use `bg-base` for cards — cards must be visually elevated above the warm page background. Never place a card inside another card.

### Panels

Used for the filter sidebar, checkout summary, admin data tables, and other self-contained tools.

```
bg-surface rounded-2xl border border-border-default
Panel header: px-5 py-4 border-b border-border-default
Panel body:   p-5
```

Panels may contain tables, lists, forms, or repeated item cards. Never stack a panel inside another panel.

### Inputs

```
bg-subtle border border-border-default rounded-xl h-10 px-3
text-primary placeholder:text-muted
focus:border-accent-border focus:ring-1 focus:ring-accent-border
transition-colors outline-none
```

### Buttons

**Primary button** — Search, Reserve, Pay Now, Save (admin)

```
bg-accent-primary hover:bg-accent-hover
text-white font-medium
h-9 px-4 rounded-xl
transition-colors
Active/loading: opacity-70 cursor-not-allowed
Accent glow on hover: hover:shadow-accent (primary CTA only)
```

**Secondary button** — cancel, back, secondary actions

```
bg-elevated hover:bg-subtle
border border-border-default hover:border-border-subtle
text-secondary hover:text-primary
h-9 px-4 rounded-xl
transition-colors
```

**Ghost button** — icon buttons, dismiss, inline actions (favorite/compare toggles)

```
hover:bg-subtle
text-muted hover:text-secondary
h-8 w-8 rounded-xl (icon only)
or h-8 px-3 rounded-xl (with label)
transition-colors
```

**Destructive button** — cancel booking, delete hotel/room (admin), remove review

```
bg-error-dim hover:bg-error/20
border border-error/25
text-error
h-9 px-4 rounded-xl
transition-colors
```

### Booking Status Badges

```
Base structure:
  inline-flex items-center gap-1.5
  px-2.5 py-1 rounded-full text-xs font-medium

Confirmed:       bg-success-dim text-success border border-success/20
Pending Payment: bg-warning-dim text-warning border border-warning/20
Completed:       bg-info-dim text-info border border-info/20
Cancelled:       bg-neutral-dim text-neutral border border-neutral/20
Failed:          bg-error-dim text-error border border-error/20
```

Never use plain colored text without the dim background for status badges.

### Star Rating

Used on hotel cards, hotel details, and reviews.

```
Wrapper:      inline-flex items-center gap-0.5
Filled star:  text-rating-star, h-4 w-4 (Lucide Star, filled fill-current)
Empty star:   text-rating-star-empty, h-4 w-4
Numeric label (optional): ml-1.5 text-sm font-medium text-text-primary
```

Guest rating (review-score style, e.g. "9.2 Excellent") uses a separate compact badge, not the star row:

```
inline-flex items-center gap-1.5 rounded-lg bg-info-dim px-2 py-1
Score: text-sm font-bold text-info
Label: text-xs text-text-secondary
```

### Hotel Card

Used on search results, favorites (with a distinct treatment, see below), and compare add-flows.

```
Wrapper:        Card pattern above, overflow-hidden
Image:          aspect-[4/3] rounded-t-2xl object-cover, relative (favorite/compare toggles absolutely positioned top-right)
Body:           p-4 flex flex-col gap-2
Name:           text-base font-medium text-text-primary
Rating row:     star rating + guest rating badge + review count (text-xs text-text-muted)
Location row:   text-sm text-text-secondary, distance in text-xs text-text-muted, with a small map-pin icon (h-3.5 w-3.5 text-text-muted) that pans/highlights the hotel on Map view when clicked
Amenity chips:  Skill-Tag pattern (below), max 3 shown + "+N more"
Price row:      mt-auto flex items-end justify-between
  Price:        text-xl font-bold text-text-primary, discount shown as line-through text-text-faint beside it
  CTA:          Secondary button, "See availability" → View Details
```

### Favorites Card

Same Card pattern as the hotel card, but with a `border-accent-border` 1px inset ring and a small `"Saved on {date}"` caption in `text-xs text-text-muted` under the name — enough of a visual difference that the page is unmistakably Favorites, not Search results, at a glance.

### Filter Sidebar

```
Wrapper:      Panel pattern, sticky top-20 (below navbar), w-72
Section:      border-b border-border-default py-4 last:border-0
Section title: text-sm font-medium text-text-primary mb-3
Checkbox row: flex items-center gap-2 text-sm text-text-secondary
Price range:  dual-handle slider using accent-primary for the active track
Active filter chip (above results): Skill-Tag pattern with a trailing remove (x)
```

### Skill Tag / Amenity Chip

```
inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs
bg-accent-dim text-accent-text border border-accent-border
Remove icon (if removable): h-3 w-3 text-accent-text hover:text-text-primary cursor-pointer
```

### Compare Table

```
Table wrapper:  bg-surface rounded-2xl border border-border-default overflow-x-auto
First two hotels: shown inline, columns min-w-[16rem]
Third+ hotels:    same column width, revealed via horizontal scroll — never wrap or shrink columns to fit
Row label column: sticky left-0 bg-surface text-sm font-medium text-text-secondary
AI summary slot:  reserved bottom section, bg-elevated rounded-2xl border border-border-default p-5, hidden until the AI phase ships
```

### Table (admin — hotels list, bookings list)

```
Table wrapper:  bg-surface rounded-2xl border border-border-default overflow-hidden
Header row:     bg-subtle border-b border-border-default
Header cell:    px-4 py-3 text-xs text-text-muted uppercase tracking-wide font-medium text-left
Body row:       border-b border-border-default last:border-0 hover:bg-elevated transition-colors cursor-pointer
Body cell:      px-4 py-3 text-sm text-text-secondary
Expandable row: bg-subtle border-t border-border-default px-4 py-4
```

### Stats Cards (admin dashboard)

```
bg-elevated rounded-2xl border border-border-default p-5 shadow-card
Stat number:  text-2xl font-bold text-text-primary
Stat label:   text-xs text-text-muted uppercase tracking-wide mt-1
Trend/icon:   text-accent-primary (positive) or text-error (negative)
```

### Form Fields

Used in checkout, review form, admin hotel/room forms.

```
Field wrapper:  flex flex-col gap-1.5
Label:          text-sm font-medium text-text-secondary
Input/Select:   (see Inputs pattern above)
Helper text:    text-xs text-text-muted mt-1
Error message:  text-xs text-error mt-1
```

### Empty States

Used for no search results, empty favorites, empty compare, no bookings, no reviews.

```
flex flex-col items-center justify-center py-16 gap-3
Icon:     h-10 w-10 text-text-faint
Heading:  text-base font-medium text-text-muted
Body:     text-sm text-text-faint text-center max-w-xs
CTA:      primary or secondary button (if applicable — e.g. "Clear filters", "Browse hotels")
```

### Loading States

```
Skeleton:   bg-subtle animate-pulse rounded-xl
Spinner:    h-4 w-4 border-2 border-accent-border border-t-accent-primary rounded-full animate-spin
```

Applies to search results, hotel details (gallery/rooms/reviews), favorites, compare, bookings, and admin tables.

---

## Icons

Lucide React only. Stroke-based — never filled variants, except the star rating icon which uses `fill-current` intentionally to render as a solid star.

| Context          | Size        |
| ---------------- | ----------- |
| Inline text icon | `h-4 w-4`   |
| Button icon      | `h-4 w-4`   |
| Nav icon         | `h-5 w-5`   |
| Empty state icon | `h-10 w-10` |
| Stat card icon   | `h-5 w-5`   |

Always use `strokeWidth={1.5}` for icons larger than `h-5 w-5`.

---

## Motion and Transitions

- All interactive elements use `transition-colors duration-150`
- Never use complex animations on data-heavy components — tables, search results, feeds
- Skeleton loading uses `animate-pulse` only
- Spinner uses `animate-spin` only
- The floating compare tray may use a simple `transition-all` for its enter/exit, nothing more elaborate
- No entrance animations, slide-ins, or fade-ins on search results or admin tables — they slow perceived performance

---

## Homepage Specific Rules

Homepage is the only page with a footer and marketing-style sections on the user frontend.

```
Hero section:
  Section wrapper: mx-auto max-w-7xl px-6 py-14 lg:py-20
  Content grid: grid items-center gap-10 lg:grid-cols-2 — no forced min-height. `min-h-[calc(100svh-4rem)]` was tried in Feature 05 and produced 100–300px+ of dead space above the headline (hero content is shorter than a full viewport at real screen sizes) — do not reintroduce it.
  Search widget: bg-surface rounded-2xl border border-border-default shadow-elevated p-5, wrapped in `mt-8 lg:-mt-16` so it sits with normal spacing below the hero visual on mobile/tablet and only overlaps the hero visual once the two-column layout is active (`lg:`)
  Headline: text-4xl md:text-5xl xl:text-6xl font-semibold leading-tight text-text-primary
  Subheadline: text-base leading-7 text-text-secondary max-w-xl mt-5

Trending destinations:
  Section shell: bg-surface border-y border-border-default
  Content: max-w-7xl mx-auto px-6 py-24
  Cards grid: mt-10 grid gap-6 md:grid-cols-4
  Destination card: aspect-[3/4] rounded-2xl overflow-hidden relative, city name overlaid bottom-left on a gradient scrim
```

---

## Search Page Layout

```
Content:      max-w-7xl mx-auto px-6 py-8 flex gap-6
Sidebar:      w-72 shrink-0 (Filter Sidebar pattern)
Results:      flex-1 flex flex-col gap-4
Active chips: flex flex-wrap gap-2 mb-2
Toolbar row:  flex items-center justify-between — result count (left), Sort dropdown + List/Grid/Map view toggle (right)
Sort dropdown: Input pattern sizing, h-10 rounded-xl border border-border-default bg-subtle, options: Recommended, Price low to high, Price high to low, Guest rating, Star rating, Distance from center
Grid view:    grid gap-5 sm:grid-cols-2 xl:grid-cols-3
List view:    flex flex-col gap-4, cards render as a horizontal layout (image left, details right) instead of the vertical grid card
Map view:     grid grid-cols-[1fr_28rem] gap-0 — left column is a scrollable card list (List view card style), right column is a sticky Mapbox map with a pin per result; selecting a card pans to and highlights its pin, and vice versa
Pagination:   mt-6 flex items-center justify-center gap-2 (hidden while Map view is active — the map shows all loaded results at once)
```

---

## Hotel Details Layout

```
Header:       gallery full-width, main image col-span-2 row-span-2 + 4 supporting thumbnails, rounded-2xl overflow-hidden
Content grid: grid gap-8 lg:grid-cols-[1fr_22rem]
Main column:  description, amenities, room list, reviews, similar hotels — flat sections, gap-8
Right rail:   sticky top-20, map panel + booking summary panel
```

---

## Checkout Layout

```
Content grid: grid gap-8 lg:grid-cols-[1fr_20rem]
Main column:  Stripe payment form panel
Right rail:   sticky top-20, booking summary card (hotel, dates, price breakdown)
```

---

## Admin Dashboard Layout

```
Content:      max-w-7xl mx-auto px-6 py-8 flex flex-col gap-6
Stats bar:    grid grid-cols-2 md:grid-cols-4 gap-4
Main area:    grid grid-cols-1 lg:grid-cols-3 gap-6
  Left col (lg:col-span-2): recent bookings table, top hotels
  Right col (lg:col-span-1): upcoming check-ins/check-outs
```

---

## Consistency Checklist

Before submitting any component, verify:

- [ ] All colors use token classes — no hardcoded values, no raw Tailwind color classes
- [ ] Border radius matches the context (badge=`rounded-full`/`rounded-lg`, button=`rounded-xl`, card=`rounded-2xl`, modal=`rounded-3xl`)
- [ ] Interactive elements have hover and `transition-colors`
- [ ] Text hierarchy is correct — primary for headings, secondary for body, muted for labels
- [ ] Star ratings use `rating-star`/`rating-star-empty`, never the accent color
- [ ] Booking status badges use the correct color mapping from `ui-tokens.md`
- [ ] Icons are Lucide React, stroke-based (except the filled star), correct size for context
- [ ] Component matches the closest existing pattern in `ui-registry.md`
