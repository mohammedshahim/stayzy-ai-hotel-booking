# UI Tokens

All colors, typography, spacing, and border radius values for Stayzy. These are the single source of truth. Claude must never use hardcoded hex values or raw Tailwind color classes (`orange-*`, `amber-*`, `gray-*`, etc.) anywhere in the codebase. Only use the CSS variables and Tailwind tokens defined here.

Theme: **Coastal Hospitality** — light mode, a warm cream page under cool slate neutrals, a teal accent, and a gold token reserved for star ratings.

**The two apps no longer share a palette.** `frontend/` moved to Coastal Hospitality in Feature 53; `frontend-admin/` stays on the original Warm Hospitality terracotta. This is deliberate — the re-skin was asked for on the traveler-facing app only, and a second re-skin of the staff tool was judged not worth it. Every table below is `frontend/`'s. `frontend-admin/src/index.css` still holds the values recorded in the Warm Hospitality block at the bottom of this file, and is the reference for anything built there.

What still holds across both: the token *names*, the `@theme inline` mapping pattern, the doubled class prefixes, typography, radius, and spacing. Only the color values diverge.

---

## How Tokens Are Defined

- `frontend/` — CSS custom properties in `app/globals.css`, mapped to Tailwind via `@theme inline` (Next.js + Tailwind v4 pattern)
- `frontend-admin/` — the same custom property *names* and the same `@theme inline` block, duplicated into `src/index.css` (Vite has no shared CSS import across separate apps in this repo). Since Feature 53 the values behind those names differ; the structure does not.

**The three `--shadow-*` properties live in `@theme inline`, not `:root`.** Tailwind v4 registers shadow utilities from that block, so they sit alongside `--color-*` rather than with the raw palette. This is easy to miss when re-skinning: a change to `:root` alone leaves the shadows on the old palette. Feature 53 hit exactly this.

Always use the Tailwind utility class in JSX — never reference the raw CSS variable directly.

---

## Color Tokens

### Backgrounds

| Role             | CSS Variable    | Hex/Value | Tailwind Class |
| ---------------- | --------------- | --------- | -------------- |
| Page background  | `--bg-base`     | `#FDFBF6` | `bg-base`      |
| Surface          | `--bg-surface`  | `#FFFFFF` | `bg-surface`   |
| Elevated surface | `--bg-elevated` | `#FFFFFF` | `bg-elevated`  |
| Subtle surface   | `--bg-subtle`   | `#F4F4F1` | `bg-subtle`    |
| Overlay          | `--bg-overlay`  | `rgba(31,41,55,0.45)` | `bg-overlay` |

The page background is a warm cream, never pure white — it makes cards feel like they're sitting on a tablecloth rather than a screen. `bg-surface` and `bg-elevated` are both pure white; the two are differentiated by shadow, not fill — `bg-surface` panels use a border only, `bg-elevated` cards always carry `shadow-card` or `shadow-elevated`.

**`bg-subtle` is near-neutral, not cream, and that is deliberate.** Its dominant job is input fills and hover states — nearly every input in the app is `border-border-default bg-subtle`, so it always appears *inside* a cool-bordered white card, not on the cream page. Feature 53 first set it to a matching warm `#F5F1E8` and the running app showed the problem immediately: a warm fill inside a cool border reads pink, and it was the one thing on screen still looking like the old palette. `#F4F4F1` keeps a whisper of warmth so it agrees with the cream page, without fighting the borders it actually touches. Do not "correct" it back toward the page background.

### Borders

| Role           | CSS Variable       | Hex       | Tailwind Class   |
| -------------- | ------------------ | --------- | ---------------- |
| Default border | `--border-default` | `#E5E7EB` | `border-border-default` |
| Subtle border  | `--border-subtle`  | `#D1D5DB` | `border-border-subtle`  |
| Strong border  | `--border-strong`  | `#9CA3AF` | `border-border-strong`  |

Despite the names, the ramp darkens `default` → `subtle` → `strong`; `subtle` is the *hover* border, one step firmer than the resting one. That ordering predates Feature 53 and was preserved through it.

The class name doubles the category prefix (`border-border-default`, not `border-default`) because the registered color token key already includes `border-` (`--color-border-default`) — same reason text tokens are `text-text-primary`, not `text-primary`. Verified by compiling the actual Tailwind output; the short form silently resolves to nothing or the wrong color.

### Text

| Role           | CSS Variable       | Hex       | Tailwind Class   |
| -------------- | ------------------ | --------- | ---------------- |
| Primary text   | `--text-primary`   | `#1F2937` | `text-primary`   |
| Secondary text | `--text-secondary` | `#4B5563` | `text-secondary` |
| Muted text     | `--text-muted`     | `#6B7280` | `text-muted`     |
| Faint text     | `--text-faint`     | `#9CA3AF` | `text-faint`     |

Cool slate rather than the warm browns this ramp used before Feature 53 — the cream page reads as paper and the slate reads as ink, which is what lets the background stay warm while everything drawn on it goes cool.

Measured against `#FDFBF6`: primary, secondary (7.3:1) and muted (4.7:1) all pass WCAG AA for normal text. **`text-faint` is 2.4:1 and fails**, exactly as the warm `#B7AC96` it replaced did — it is for placeholder and decorative text only, never for anything a user has to read.

### Accent — Teal

| Role           | CSS Variable       | Hex/Value               | Tailwind Class   |
| -------------- | ------------------ | ------------------------ | ---------------- |
| Accent primary | `--accent-primary` | `#0F766E`                | `accent-primary` |
| Accent hover   | `--accent-hover`   | `#0B5F58`                | `accent-hover`   |
| Accent dim     | `--accent-dim`     | `rgba(15,118,110,0.10)`  | `accent-dim`     |
| Accent text    | `--accent-text`    | `#115E59`                | `accent-text`    |
| Accent border  | `--accent-border`  | `rgba(15,118,110,0.25)`  | `accent-border`  |

`accent-text` is deliberately a deeper shade than `accent-primary` (unlike a dark-mode palette, where accent text needs to be *brighter* than the accent fill) — on a light/white background, text needs more saturation and less luminance than a button fill to stay readable and pass contrast. Measured against white: `accent-primary` is 5.45:1 and `accent-text` is 7.69:1, both AA. `--primary-foreground` (white text on `accent-primary` fills) passes at the same 5.45:1, so it needed no change when the hue moved from terracotta to teal.

### Ratings — Gold (separate from the brand accent)

| Role               | CSS Variable          | Hex       | Tailwind Class       |
| ------------------- | --------------------- | --------- | --------------------- |
| Star (filled)        | `--rating-star`       | `#C6A664` | `rating-star`         |
| Star (empty/outline) | `--rating-star-empty` | `#DCE0E5` | `rating-star-empty`   |

Star ratings always use this gold token, never the teal accent — ratings are a near-universal visual convention independent of brand color, and mixing the two would make the brand accent feel diluted everywhere a rating appears (which is most cards on this site). This gold is also Feature 53's brand-anchor gold (`#C6A664`, replacing the older amber `#F2A93B`) — with the brand accent now teal, gold no longer sits next to a warm accent, so the "mixing the two" risk above no longer applies. The separation this section argues for is now automatic rather than a token-naming discipline someone has to maintain.

### Status Colors

| Role        | CSS Variable          | Hex/Value                | Tailwind Class      |
| ----------- | --------------------- | -------------------------- | -------------------- |
| Success     | `--state-success`     | `#15803D`                  | `success`      |
| Success dim | `--state-success-dim` | `rgba(21,128,61,0.10)`     | `success-dim`  |
| Error       | `--state-error`       | `#D64545`                  | `error`        |
| Error dim   | `--state-error-dim`   | `rgba(214,69,69,0.10)`     | `error-dim`    |
| Warning     | `--state-warning`     | `#B45309`                  | `warning`      |
| Warning dim | `--state-warning-dim` | `rgba(180,83,9,0.10)`      | `warning-dim`  |
| Info        | `--state-info`        | `#2E7BC4`                  | `info`         |
| Info dim    | `--state-info-dim`    | `rgba(46,123,196,0.10)`    | `info-dim`     |
| Neutral     | `--state-neutral`     | `#6B7280`                  | `neutral`      |
| Neutral dim | `--state-neutral-dim` | `rgba(107,114,128,0.12)`   | `neutral-dim`  |

Both `success` and `warning` were retuned in Feature 53 rather than carried over unchanged — the old shades were chosen for distance from *terracotta* and needed re-checking against teal. `success` moved to a greener forest so a Confirmed badge never reads as the same family as a teal primary CTA — verified side-by-side on the running Bookings page across all five booking statuses. `warning` moved off amber so it never reads as the new rating gold. Error and info were left as-is: both sit far enough from teal in hue that neither risk applies.

Corrected 2026-07-05 (found while building Feature 06): the `@theme inline` block below registers these as `--color-success`, `--color-error`, `--color-warning`, `--color-info`, `--color-neutral` (and their `-dim` variants) — there is no `--color-state-success` etc. The Tailwind Class column previously said `state-success`/`state-error`/etc., which silently compiles to nothing (same class of bug as the `border-default` vs `border-border-default` fix in Feature 03). Always use the bare form (`success`, `error-dim`, ...) in JSX — never prefix these five with `state-`.

### Booking Status Mapping

| Booking Status   | Color Token | Dim Token     |
| ----------------- | ----------- | -------------- |
| Confirmed         | `success`   | `success-dim`  |
| Pending Payment   | `warning`   | `warning-dim`  |
| Completed         | `info`      | `info-dim`     |
| Cancelled         | `neutral`   | `neutral-dim`  |
| Failed            | `error`     | `error-dim`    |

---

## Typography

| Role        | Font  | CSS Variable  | Tailwind Class |
| ----------- | ----- | ------------- | -------------- |
| UI text     | Inter | `--font-sans` | `font-sans`    |
| Code / mono | JetBrains Mono | `--font-mono` | `font-mono` |

`frontend/` loads both via `next/font/google` as CSS variables on `<html>`. `frontend-admin/` (Vite, no `next/font`) loads the same two families via `@fontsource/inter` and `@fontsource/jetbrains-mono` so both apps render pixel-identical type without depending on a CDN `<link>` tag. `font-mono` is used narrowly — booking reference codes and similar identifiers — the product is otherwise all `font-sans`.

### Font Size Scale

Use standard Tailwind font size classes. No custom sizes.

| Usage           | Class                    |
| --------------- | ------------------------ |
| Page heading    | `text-3xl font-semibold` |
| Section heading | `text-xl font-semibold`  |
| Card heading    | `text-base font-medium`  |
| Body            | `text-sm`                |
| Caption / label | `text-xs`                |
| Stat number     | `text-2xl font-bold`     |

---

## Border Radius

Radius increases with surface depth. Smaller for inner elements, larger for outer containers.

| Context                | Class          |
| ---------------------- | -------------- |
| Badges / tags / inputs | `rounded-lg`   |
| Buttons                | `rounded-xl`   |
| Cards / panels         | `rounded-2xl`  |
| Modal / overlay        | `rounded-3xl`  |
| Full circle            | `rounded-full` |

---

## Spacing Scale

Use standard Tailwind spacing. These are the most common values used in this project.

| Context            | Value              |
| ------------------ | ------------------ |
| Card padding       | `p-5` or `p-6`     |
| Section gap        | `gap-6` or `gap-8` |
| Navbar height      | `h-16`             |
| Filter sidebar padding | `p-5`          |
| Table cell padding | `px-4 py-3`        |
| Badge padding      | `px-2.5 py-1`      |
| Input height       | `h-10`             |
| Button height      | `h-9`              |
| Icon button size   | `h-8 w-8`          |

---

## Shadows

| Role            | CSS Variable        | Value                              |
| --------------- | ------------------- | ------------------------------------ |
| Card shadow     | `--shadow-card`     | `0 1px 3px rgba(31,41,55,0.08)`      |
| Elevated shadow | `--shadow-elevated` | `0 8px 24px rgba(31,41,55,0.10)`     |
| Accent glow     | `--shadow-accent`   | `0 4px 14px rgba(15,118,110,0.25)`   |

Since the theme is light, shadows do real elevation work here (unlike a dark theme where borders carry most of the separation). Accent glow is used sparingly — only on the primary CTA's hover state (Search, Reserve, Pay Now) and the floating compare tray. `--shadow-card` and `--shadow-elevated` moved from the warm-brown rgba to the cool `text-primary` rgba in Feature 53 — they live in `@theme inline`, not `:root` (see "How Tokens Are Defined" above), which is the one place in the file that is easy to edit the palette and still miss.

---

## globals.css Token Definitions

The two apps diverged in Feature 53 — `frontend/`'s block is below, `frontend-admin/`'s stays the unchanged Warm Hospitality block after it. Both share the same `@theme inline` shape; only the `:root` values differ.

### `frontend/app/globals.css` — Coastal Hospitality

```css
@theme inline {
  /* Backgrounds */
  --color-base: var(--bg-base);
  --color-surface: var(--bg-surface);
  --color-elevated: var(--bg-elevated);
  --color-subtle: var(--bg-subtle);
  --color-overlay: var(--bg-overlay);

  /* Borders */
  --color-border-default: var(--border-default);
  --color-border-subtle: var(--border-subtle);
  --color-border-strong: var(--border-strong);

  /* Text */
  --color-text-primary: var(--text-primary);
  --color-text-secondary: var(--text-secondary);
  --color-text-muted: var(--text-muted);
  --color-text-faint: var(--text-faint);

  /* Accent */
  --color-accent-primary: var(--accent-primary);
  --color-accent-hover: var(--accent-hover);
  --color-accent-dim: var(--accent-dim);
  --color-accent-text: var(--accent-text);
  --color-accent-border: var(--accent-border);

  /* Ratings */
  --color-rating-star: var(--rating-star);
  --color-rating-star-empty: var(--rating-star-empty);

  /* Status */
  --color-success: var(--state-success);
  --color-success-dim: var(--state-success-dim);
  --color-error: var(--state-error);
  --color-error-dim: var(--state-error-dim);
  --color-warning: var(--state-warning);
  --color-warning-dim: var(--state-warning-dim);
  --color-info: var(--state-info);
  --color-info-dim: var(--state-info-dim);
  --color-neutral: var(--state-neutral);
  --color-neutral-dim: var(--state-neutral-dim);

  /* Shadows */
  --shadow-card: 0 1px 3px rgba(31, 41, 55, 0.08);
  --shadow-elevated: 0 8px 24px rgba(31, 41, 55, 0.1);
  --shadow-accent: 0 4px 14px rgba(15, 118, 110, 0.25);
}

:root {
  /* Backgrounds */
  --bg-base: #fdfbf6;
  --bg-surface: #ffffff;
  --bg-elevated: #ffffff;
  --bg-subtle: #f4f4f1;
  --bg-overlay: rgba(31, 41, 55, 0.45);

  /* Borders */
  --border-default: #e5e7eb;
  --border-subtle: #d1d5db;
  --border-strong: #9ca3af;

  /* Text */
  --text-primary: #1f2937;
  --text-secondary: #4b5563;
  --text-muted: #6b7280;
  --text-faint: #9ca3af;

  /* Accent */
  --accent-primary: #0f766e;
  --accent-hover: #0b5f58;
  --accent-dim: rgba(15, 118, 110, 0.1);
  --accent-text: #115e59;
  --accent-border: rgba(15, 118, 110, 0.25);

  /* Ratings */
  --rating-star: #c6a664;
  --rating-star-empty: #dce0e5;

  /* Status */
  --state-success: #15803d;
  --state-success-dim: rgba(21, 128, 61, 0.1);
  --state-error: #d64545;
  --state-error-dim: rgba(214, 69, 69, 0.1);
  --state-warning: #b45309;
  --state-warning-dim: rgba(180, 83, 9, 0.1);
  --state-info: #2e7bc4;
  --state-info-dim: rgba(46, 123, 196, 0.1);
  --state-neutral: #6b7280;
  --state-neutral-dim: rgba(107, 114, 128, 0.12);
}
```

Note: in the actual file, the three `--shadow-*` lines sit at the end of `@theme inline`, not `:root` — reproduced that way above; do not move them when copying this block.

### `frontend-admin/src/index.css` — Warm Hospitality (unchanged)

```css
@theme inline {
  /* Backgrounds */
  --color-base: var(--bg-base);
  --color-surface: var(--bg-surface);
  --color-elevated: var(--bg-elevated);
  --color-subtle: var(--bg-subtle);
  --color-overlay: var(--bg-overlay);

  /* Borders */
  --color-border-default: var(--border-default);
  --color-border-subtle: var(--border-subtle);
  --color-border-strong: var(--border-strong);

  /* Text */
  --color-text-primary: var(--text-primary);
  --color-text-secondary: var(--text-secondary);
  --color-text-muted: var(--text-muted);
  --color-text-faint: var(--text-faint);

  /* Accent */
  --color-accent-primary: var(--accent-primary);
  --color-accent-hover: var(--accent-hover);
  --color-accent-dim: var(--accent-dim);
  --color-accent-text: var(--accent-text);
  --color-accent-border: var(--accent-border);

  /* Ratings */
  --color-rating-star: var(--rating-star);
  --color-rating-star-empty: var(--rating-star-empty);

  /* Status */
  --color-success: var(--state-success);
  --color-success-dim: var(--state-success-dim);
  --color-error: var(--state-error);
  --color-error-dim: var(--state-error-dim);
  --color-warning: var(--state-warning);
  --color-warning-dim: var(--state-warning-dim);
  --color-info: var(--state-info);
  --color-info-dim: var(--state-info-dim);
  --color-neutral: var(--state-neutral);
  --color-neutral-dim: var(--state-neutral-dim);

  /* Shadows */
  --shadow-card: 0 1px 3px rgba(36, 29, 20, 0.08);
  --shadow-elevated: 0 8px 24px rgba(36, 29, 20, 0.1);
  --shadow-accent: 0 4px 14px rgba(194, 84, 45, 0.25);
}

:root {
  /* Backgrounds */
  --bg-base: #fbf6ef;
  --bg-surface: #ffffff;
  --bg-elevated: #ffffff;
  --bg-subtle: #f5eee1;
  --bg-overlay: rgba(36, 29, 20, 0.45);

  /* Borders */
  --border-default: #e8e0d0;
  --border-subtle: #d9ceb5;
  --border-strong: #c7b896;

  /* Text */
  --text-primary: #241d14;
  --text-secondary: #5c5240;
  --text-muted: #8a7f6a;
  --text-faint: #b7ac96;

  /* Accent */
  --accent-primary: #c2542d;
  --accent-hover: #a8461f;
  --accent-dim: rgba(194, 84, 45, 0.1);
  --accent-text: #96401f;
  --accent-border: rgba(194, 84, 45, 0.25);

  /* Ratings */
  --rating-star: #f2a93b;
  --rating-star-empty: #e3dacb;

  /* Status */
  --state-success: #1f9d63;
  --state-success-dim: rgba(31, 157, 99, 0.1);
  --state-error: #d64545;
  --state-error-dim: rgba(214, 69, 69, 0.1);
  --state-warning: #c97a1b;
  --state-warning-dim: rgba(201, 122, 27, 0.1);
  --state-info: #2e7bc4;
  --state-info-dim: rgba(46, 123, 196, 0.1);
  --state-neutral: #71695a;
  --state-neutral-dim: rgba(113, 105, 90, 0.12);
}
```
