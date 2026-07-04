# UI Tokens

All colors, typography, spacing, and border radius values for Stayzy. These are the single source of truth. Claude must never use hardcoded hex values or raw Tailwind color classes (`orange-*`, `amber-*`, `gray-*`, etc.) anywhere in the codebase. Only use the CSS variables and Tailwind tokens defined here.

Theme: **Warm Hospitality** — light mode, warm off-white neutrals, a terracotta accent, and a dedicated gold token reserved for star ratings.

Both `frontend/` and `frontend-admin/` share this exact token set so the two apps feel like the same product family, even though one targets travelers and the other targets internal staff.

---

## How Tokens Are Defined

- `frontend/` — CSS custom properties in `app/globals.css`, mapped to Tailwind via `@theme inline` (Next.js + Tailwind v4 pattern)
- `frontend-admin/` — the same CSS custom properties and `@theme inline` block, duplicated into `src/index.css` (Vite has no shared CSS import across separate apps in this repo)

Always use the Tailwind utility class in JSX — never reference the raw CSS variable directly.

---

## Color Tokens

### Backgrounds

| Role             | CSS Variable    | Hex/Value | Tailwind Class |
| ---------------- | --------------- | --------- | -------------- |
| Page background  | `--bg-base`     | `#FBF6EF` | `bg-base`      |
| Surface          | `--bg-surface`  | `#FFFFFF` | `bg-surface`   |
| Elevated surface | `--bg-elevated` | `#FFFFFF` | `bg-elevated`  |
| Subtle surface   | `--bg-subtle`   | `#F5EEE1` | `bg-subtle`    |
| Overlay          | `--bg-overlay`  | `rgba(36,29,20,0.45)` | `bg-overlay` |

The page background is a warm ivory, never pure white — it makes cards feel like they're sitting on a tablecloth rather than a screen. `bg-surface` and `bg-elevated` are both pure white; the two are differentiated by shadow, not fill — `bg-surface` panels use a border only, `bg-elevated` cards always carry `shadow-card` or `shadow-elevated`. `bg-subtle` is the warm beige used for input fills, table header rows, and hover states.

### Borders

| Role           | CSS Variable       | Hex       | Tailwind Class   |
| -------------- | ------------------ | --------- | ---------------- |
| Default border | `--border-default` | `#E8E0D0` | `border-border-default` |
| Subtle border  | `--border-subtle`  | `#D9CEB5` | `border-border-subtle`  |
| Strong border  | `--border-strong`  | `#C7B896` | `border-border-strong`  |

The class name doubles the category prefix (`border-border-default`, not `border-default`) because the registered color token key already includes `border-` (`--color-border-default`) — same reason text tokens are `text-text-primary`, not `text-primary`. Verified by compiling the actual Tailwind output; the short form silently resolves to nothing or the wrong color.

### Text

| Role           | CSS Variable       | Hex       | Tailwind Class   |
| -------------- | ------------------ | --------- | ---------------- |
| Primary text   | `--text-primary`   | `#241D14` | `text-primary`   |
| Secondary text | `--text-secondary` | `#5C5240` | `text-secondary` |
| Muted text     | `--text-muted`     | `#8A7F6A` | `text-muted`     |
| Faint text     | `--text-faint`     | `#B7AC96` | `text-faint`     |

Warm dark browns instead of cool blacks/grays — matches the warm ivory background instead of fighting it.

### Accent — Terracotta

| Role           | CSS Variable       | Hex/Value               | Tailwind Class   |
| -------------- | ------------------ | ------------------------ | ---------------- |
| Accent primary | `--accent-primary` | `#C2542D`                | `accent-primary` |
| Accent hover   | `--accent-hover`   | `#A8461F`                | `accent-hover`   |
| Accent dim     | `--accent-dim`     | `rgba(194,84,45,0.10)`   | `accent-dim`     |
| Accent text    | `--accent-text`    | `#96401F`                | `accent-text`    |
| Accent border  | `--accent-border`  | `rgba(194,84,45,0.25)`   | `accent-border`  |

`accent-text` is deliberately a deeper shade than `accent-primary` (unlike a dark-mode palette, where accent text needs to be *brighter* than the accent fill) — on a light/white background, text needs more saturation and less luminance than a button fill to stay readable and pass contrast.

### Ratings — Gold (separate from the brand accent)

| Role               | CSS Variable          | Hex       | Tailwind Class       |
| ------------------- | --------------------- | --------- | --------------------- |
| Star (filled)        | `--rating-star`       | `#F2A93B` | `rating-star`         |
| Star (empty/outline) | `--rating-star-empty` | `#E3DACB` | `rating-star-empty`   |

Star ratings always use this gold token, never the terracotta accent — ratings are a near-universal visual convention independent of brand color, and mixing the two would make the brand accent feel diluted everywhere a rating appears (which is most cards on this site).

### Status Colors

| Role        | CSS Variable          | Hex/Value                | Tailwind Class      |
| ----------- | --------------------- | -------------------------- | -------------------- |
| Success     | `--state-success`     | `#1F9D63`                  | `state-success`      |
| Success dim | `--state-success-dim` | `rgba(31,157,99,0.10)`     | `state-success-dim`  |
| Error       | `--state-error`       | `#D64545`                  | `state-error`        |
| Error dim   | `--state-error-dim`   | `rgba(214,69,69,0.10)`     | `state-error-dim`    |
| Warning     | `--state-warning`     | `#C97A1B`                  | `state-warning`      |
| Warning dim | `--state-warning-dim` | `rgba(201,122,27,0.10)`    | `state-warning-dim`  |
| Info        | `--state-info`        | `#2E7BC4`                  | `state-info`         |
| Info dim    | `--state-info-dim`    | `rgba(46,123,196,0.10)`    | `state-info-dim`     |
| Neutral     | `--state-neutral`     | `#71695A`                  | `state-neutral`      |
| Neutral dim | `--state-neutral-dim` | `rgba(113,105,90,0.12)`    | `state-neutral-dim`  |

`state-warning` is deliberately shifted more brown/yellow than `accent-primary` so a warning badge never gets visually confused with a primary CTA.

### Booking Status Mapping

| Booking Status   | Color Token     | Dim Token           |
| ----------------- | --------------- | -------------------- |
| Confirmed         | `state-success` | `state-success-dim`  |
| Pending Payment   | `state-warning` | `state-warning-dim`  |
| Completed         | `state-info`    | `state-info-dim`     |
| Cancelled         | `state-neutral` | `state-neutral-dim`  |
| Failed            | `state-error`   | `state-error-dim`    |

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
| Card shadow     | `--shadow-card`     | `0 1px 3px rgba(36,29,20,0.08)`      |
| Elevated shadow | `--shadow-elevated` | `0 8px 24px rgba(36,29,20,0.10)`     |
| Accent glow     | `--shadow-accent`   | `0 4px 14px rgba(194,84,45,0.25)`    |

Since the theme is light, shadows do real elevation work here (unlike a dark theme where borders carry most of the separation). Accent glow is used sparingly — only on the primary CTA's hover state (Search, Reserve, Pay Now) and the floating compare tray.

---

## globals.css Token Definitions

Identical block shared by `frontend/app/globals.css` and `frontend-admin/src/index.css`.

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

  /* Shadows */
  --shadow-card: 0 1px 3px rgba(36, 29, 20, 0.08);
  --shadow-elevated: 0 8px 24px rgba(36, 29, 20, 0.1);
  --shadow-accent: 0 4px 14px rgba(194, 84, 45, 0.25);
}
```
