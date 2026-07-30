# Iteration Plan

Companion to `build-plan.md`, covering Features 52–55 — the first work after the 2026-07-30 production launch. Read `architecture.md`, `code-standards.md`, `ui-tokens.md`, and `progress-tracker.md` before starting any feature here — this file adds to them, it does not replace them.

Scoped with the developer on 2026-07-30 from four pieces of post-launch feedback. Every decision below is confirmed unless explicitly marked as an assumption.

---

## What makes this phase different

Phases 1–16 built a product against a plan. This phase changes a product that is **already live and already has real sessions in it**. Two consequences that do not apply to any earlier feature in this repo:

- **A migration now runs against production data**, not a seeded dev database. Feature 52's down file is not a formality.
- **`frontend/`'s palette is the visible product.** Feature 53 touches one file but changes every screen, so it is verified by looking at the running app across every route, not by reading CSS.

**Execution order is 52 → 53 → 54 → 55**, and 53 comes before 54 and 55 deliberately: the banner image is chosen against the final palette, and the profile page is built once, in the final colors, rather than restyled a week later.

---

## Findings from the scoping pass

Verified against the codebase on 2026-07-30. Two of these change feature scope.

**`/profile` is already linked and already 404s.** `frontend/components/layout/AccountMenu.tsx:41` renders a `Link href="/profile"`, and no such route exists under `frontend/app/`. Every logged-in user who opens the account menu and clicks Profile hits a 404 in production today. Feature 55 is a bug fix wearing a feature's clothes.

**The palette lives in exactly one file.** A repo-wide grep for hex literals across `frontend/app`, `components`, `features`, and `lib` returns **zero matches outside `app/globals.css`** — every component already goes through the token layer. Feature 53 is a `:root` edit, not a sweep. The discipline `ui-tokens.md` demanded actually held.

**`user.avatarUrl` exists everywhere except the writer.** The column is in `backend/src/models/auth.schema.ts:10`, registered as a better-auth `additionalField` in `config/auth.ts:44`, typed in `frontend/lib/get-server-session.ts:7`, and read in `backend/src/queries/reviews.queries.ts:38`. Nothing has ever written it. Feature 55 is the first writer, which makes it the first time the review avatar renders with a real value.

**`email.service.ts` has no throttle of any kind.** Two senders (`sendVerificationEmail`, `sendPasswordResetEmail`), both called from better-auth callbacks in `config/auth.ts`, both firing on every click.

---

## Decisions

**The email cooldown is a database table, not an in-memory map.** `stayzy-api` is a single free-tier Render instance, so a `Map` would work — right up until a restart or redeploy, which resets the cooldown for exactly the user who is hammering the button, and free-tier instances restart often. The state is small, Postgres is already there, and the DB answer is also the only one that survives ever running a second instance.

**Suppression is silent.** `sendVerificationEmail` / `sendPasswordResetEmail` are awaited inside better-auth's `sendResetPassword` and `sendVerificationEmail` callbacks. Throwing from a suppressed send turns "you already have an email, check your inbox" into a visible API error, and on the password-reset path it leaks whether an address has an account — better-auth's response is otherwise deliberately identical for a known and an unknown address. The suppressed call returns normally and logs server-side.

**The throttle is per purpose, not blanket over `sendEmail`.** Gating the shared `sendEmail` helper means a booking confirmation added later silently inherits a 20-minute cooldown and a user who books twice gets one email. The key is `(recipient, purpose)`, and a purpose opts in.

**`frontend/` and `frontend-admin/` stop sharing a palette.** `ui-tokens.md` currently states, as a rule, that both apps carry the same token set "so the two apps feel like the same product family." Feature 53 breaks that on purpose — the developer asked for the new palette on the traveler-facing app only. This is a deviation to record in `ui-tokens.md`, not drift to discover later. Staff-facing warmth is not worth a second re-skin.

**The banner asset is supplied by the developer.** `frontend/public/` holds only Next's stock `file/globe/next/vercel/window.svg`. Feature 54 does not start until the file exists — not sourced from stock, not generated, not borrowed from the seeded hotel images.

---

## The palette

Anchors given by the developer:

| Purpose | Hex |
| --- | --- |
| Primary | `#0F766E` |
| Accent | `#C6A664` |
| Background | `#FDFBF6` |
| Text | `#1F2937` |
| Surface | `#FFFFFF` |

Everything else in `globals.css`'s `:root` is derived from these. Three traps in the derivation, all easy to miss:

- **The three `--shadow-*` values sit in `@theme inline`, not `:root`**, and have the old palette hardcoded into their rgba — `rgba(36,29,20,…)` is the warm brown text and `rgba(194,84,45,…)` is the terracotta accent. They are outside the block being edited and will read as a warm smudge under a teal UI.
- **`#C6A664` fails WCAG AA as text on white.** It is a fill, border, and highlight color. Any accent *text* tier needs its own darker value, exactly as the current `--accent-text` (`#96401F`) is deeper than `--accent-primary` (`#C2542D`) and for the same reason. `#0F766E` passes for both text and button fill.
- **`#C6A664` collides with `--rating-star` (`#F2A93B`).** `ui-tokens.md` argues at length that ratings use a gold deliberately separate from the brand accent, so the two never read as one thing. A gold brand accent makes that argument false. Either the star token shifts or the accent gold stays off anything rating-shaped — resolve it in the feature, and correct that section of `ui-tokens.md` either way.

The warm text ramp (`--text-secondary` `#5C5240` through `--text-faint` `#B7AC96`) and the warm border ramp both have to move to the cool `#1F2937` family. Leaving them is the single most likely way for this to end up looking half-changed.

---

## Build Phases

### Phase 17 — Post-Launch Iteration

**52. Email send throttle** — one transactional auth email per `(recipient, purpose)` per 20 minutes. New table in a new `backend/src/models/email.schema.ts`, migration in `backend/drizzle/` **with its hand-written `.down.sql` sibling** (`migrate-down.ts:48-53` refuses without one). `email.service.ts` gains a throttled path around `sendEmail`; the two existing purposes are `email_verification` and `password_reset`. The window is an env var defaulting to 20 minutes, not a literal. Suppression returns normally and `console.warn`s.
*Test:* request a password reset twice inside 20 minutes against the real app — one email arrives, both API responses are byte-identical. Repeat for resend-verification. Roll the migration back and forward.

**53. Frontend palette re-skin** — the table above, applied to `frontend/app/globals.css` only. `frontend-admin/src/index.css` is untouched. Derive the full ramp: backgrounds, the three borders, the four text tiers, the five `--accent-*` values, the shadow rgba in `@theme inline`, and the status colors (the warm `#C97A1B` warning in particular needs re-tuning against teal). Update `ui-tokens.md` — both the values and the now-false claim that the two apps share a token set.
*Test:* walk the running app on `localhost` (never `127.0.0.1`) — homepage, search, hotel details, checkout, bookings, favorites, compare, `/assistant`, and the chat widget. No screen still reading terracotta, no unreadable accent text, no warm shadow under a cool card. `frontend-admin/` visually unchanged.

**54. Homepage banner** — replace the `HotelIcon` placeholder block in `frontend/app/page.tsx` with the developer-supplied image. `next/image`, `priority` (it is the LCP element), explicit `sizes`, real `alt`. Preserve the layout contract: the `aspect-[4/3] rounded-3xl overflow-hidden` frame, and the `lg:-mt-16` negative margin that pulls `HeroSearchWidget` up over the section — both break easily. `next.config.ts` has no `images` block; a local file needs none, a remote one needs `remotePatterns` or the build fails.
*Test:* mobile, tablet, and desktop widths in the real app. Hero copy and the search widget stay legible wherever they overlap the image.

**55. Profile page** — `frontend/app/profile/page.tsx` (server component, redirect to `/login` on a null session) plus a new `frontend/features/profile/`. Four sections: display name and avatar (editable), email (read-only, with verification state and a resend action for unverified accounts), change password, and quiet links across to Bookings and Favorites. Minimal and clean — `ui-rules.md` and `ui-registry.md` govern, and `/imprint` runs after.
*Test:* both a password account and a Google account against the real seeded database. Name change persists across a reload; avatar upload replaces and the old S3 object is deleted; the review avatar renders the new value.

**Feature 55's backend surface is smaller than it looks.** better-auth already provides `updateUser` (which covers `avatarUrl`, since it is a registered additional field), `changePassword`, and `sendVerificationEmail` — prefer all three over new endpoints. The one genuine gap is the avatar upload itself: it is multipart, so it needs a real route behind `requireAuth`, and `multerUpload.ts` plus `upload.service.ts` (`uploadImage(file, "avatars")`, `deleteImageByUrl` for the replaced one) already do the work.

**A Google-only account has no password**, so the change-password section must not render for it — not disabled, absent. `account.providerId` is what distinguishes them.

**Feature 55's resend button meets Feature 52's throttle.** A second resend inside the window is silently suppressed by design, so the button's success copy cannot flatly claim an email was just sent. Word it as "check your inbox" rather than "sent" — the message stays true either way, and it does not reintroduce the disclosure that made suppression silent in the first place.

---

## Assumptions (not explicitly confirmed)

- 20 minutes is a fixed product rule rather than a starting value to tune. It is behind an env var either way.
- The profile page needs no new backend read — `getServerSession()` already returns `id`, `email`, `name`, `avatarUrl`, and `emailVerified`, which is every field the page displays.
- Account deletion is out of scope. It was offered and declined; it would need a decision on what happens to that user's bookings and reviews first.
- Nothing here touches `agent/`, and no AI surface changes.

---

## How to use this file

One feature per session. At the start of each: read the numbered item above, confirm current status in `progress-tracker.md`, implement only that feature's scope, then update `progress-tracker.md` the same way every other feature in this project does. Features 53–55 assume the one before them has landed.
