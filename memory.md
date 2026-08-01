# Memory — Feature 54 Homepage banner, complete. Phase 17 open.

Last updated: 2026-08-01

## What was built

**Feature 54 Homepage banner** — replaced the `HotelIcon` placeholder in `frontend/app/page.tsx` with the developer-supplied `frontend/public/home-banner.webp`, using a plain `<img>` (not `next/image`). Two commits on branch **`feature/52-email-send-throttle`** (stacked on Features 52 and 53, per `iteration-plan.md`'s 52→53→54→55 order), none on `main`, nothing pushed:

- `9fab3ce` `feat(frontend)` — the page change + the new binary asset, 8 lines across 2 files
- `1644ff0` `docs(context)` — `progress-tracker.md` closed out, 19 lines

The `<img>` carries `src="/home-banner.webp"`, a real `alt`, `fetchPriority="high"`, `loading="eager"`, `decoding="async"`, and `className="absolute inset-0 h-full w-full object-cover"` inside the pre-existing `relative aspect-[4/3] overflow-hidden rounded-3xl bg-elevated` frame. `next.config.ts` untouched — a local file under `public/` needs no `images` block.

## Decisions made

- **Plain `<img>`, not `next/image` — the developer's explicit instruction**, overriding `iteration-plan.md`'s Feature 54 entry (written before this session, which named `next/image` with `priority`). I had started implementing with `next/image` before the correction landed. LCP intent is now expressed via `fetchPriority="high"` + `loading="eager"`, the native-`<img>` equivalents of what `next/image`'s `preload` prop would set.
- **`sizes` attribute deliberately omitted** — it only affects `srcset` generation, and a plain `<img>` with a single static `src` has no `srcset` to affect. Included once, then removed as dead weight.
- **`next/image`'s `priority` prop is deprecated as of Next.js 16** (confirmed against `node_modules/next/dist/docs/.../image.md` — this repo runs 16.2.10) in favor of `preload`. `iteration-plan.md`'s wording predates this and is now stale for any future `next/image` usage in this repo. Recorded as an Open item in `progress-tracker.md` since this repo still has zero live `next/image` usage to point to as a corrected example.

## Problems solved

Nothing repo-breaking this session — the only friction was the `next/image` → plain `<img>` pivot above, corrected before any broken state was verified or committed.

## Current state

`npx tsc --noEmit` clean. `pnpm lint` gives exactly one expected warning, `@next/next/no-img-element` on `frontend/app/page.tsx` — deliberate, given the plain-`<img>` decision — and nothing else. Working tree clean; both commits already made.

Verified against the real running app on `localhost` (local backend, local dev DB): a Playwright pass screenshotted mobile (390px), tablet (834px), and desktop (1440px). Image reports `naturalWidth: 1200, naturalHeight: 896, complete: true` and fills the `aspect-[4/3]` frame at all three widths. The `lg:-mt-16` overlap between the image and `HeroSearchWidget` only activates at the desktop breakpoint (grid stacks to one column below `lg`, so tablet/mobile show the widget below the image with no overlap, unchanged from before this feature) — at desktop, the white search card sits over the bottom of the banner and stays fully legible against it.

Both dev servers (backend `:4000`, frontend `:3000`) were stopped after verification. Playwright was installed `--no-save` into a job-scratch scratch dir, not into the project — consistent with prior sessions.

Context updated: `progress-tracker.md` only (checklist, Current Status feature/next-up lines, Completed Features entry, session log, two new Open items — Feature 54 undeployed, and the `next/image` `priority`→`preload` deprecation note).

## Next session starts with

**Feature 55 — profile page.** `frontend/app/profile/page.tsx` (server component, redirect to `/login` on a null session) plus a new `frontend/features/profile/`. Four sections: display name and avatar (editable), email (read-only, verification state + resend), change password, quiet links to Bookings and Favorites. Read `iteration-plan.md`'s notes first:

- **Backend surface is smaller than it looks** — better-auth already provides `updateUser` (covers `avatarUrl`), `changePassword`, `sendVerificationEmail`. The one genuine gap is avatar upload itself (multipart, needs a real route behind `requireAuth`); `multerUpload.ts` + `upload.service.ts` (`uploadImage(file, "avatars")`, `deleteImageByUrl`) already do the work.
- **A Google-only account has no password** — the change-password section must be absent, not disabled, for it. `account.providerId` distinguishes.
- **The resend button meets Feature 52's throttle** — a second resend inside the 20-minute window is silently suppressed by design, so its success copy must say "check your inbox," never "sent."
- `ui-rules.md` and `ui-registry.md` govern the UI; `/imprint` runs after building it.

Carry-overs, unchanged from last two sessions:

1. **Apply migration `0005` to production** before or with deploying Feature 52's code.
2. **Feature 53's CSS change and Feature 54's page change are both still undeployed** — one Vercel push covers both, no migration involved.
3. **Decide what happens to `feature/52-email-send-throttle`.** Now carries Features 52, 53, and 54; still one merge away from `main`.

## Open questions

- Everything carried from Feature 52 and 53's memory (20-minute window tunability, the accepted send race, the `better-auth` version mismatch between `backend`/`frontend`, missing env vars in `code-standards.md`'s table, whether `--border-strong`/`--rating-star-empty` are exactly right, whether success/warning read right stacked against `--state-info`) — untouched this session, still open.
- Whether the developer wants `next/image` reconsidered for this image later (e.g. if the banner needs responsive variants), now that the `priority`→`preload` deprecation is on record — not raised again this session after the explicit plain-`<img>` call.
