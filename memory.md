# Memory — Feature 53 Frontend palette re-skin, complete. Phase 17 open.

Last updated: 2026-08-01

## What was built

**Feature 53 Frontend palette re-skin** — moved `frontend/app/globals.css` from Warm Hospitality (terracotta/ivory) to **Coastal Hospitality** (teal `#0F766E` / cream `#FDFBF6` / cool slate `#1F2937`). Two commits, both on branch **`feature/52-email-send-throttle`** (stacked on Feature 52, per `iteration-plan.md`'s 52→53→54→55 order), none on `main`, nothing pushed:

- `f7cdefc` `feat(frontend)` — the palette change, 26 lines, `globals.css` only
- `7724879` `docs(context)` — `ui-tokens.md` full re-derivation, `progress-tracker.md` closed out

Only `:root` and the three `--shadow-*` in `@theme inline` changed. Confirmed by a pre-edit grep sweep (zero hex literals, zero `rgba()`, zero raw Tailwind palette classes anywhere in `app`, `components`, `features`, `lib` outside `globals.css`) and a post-edit `git diff --stat` showing exactly one file. `frontend-admin/src/index.css` was not touched — the two apps now carry genuinely different palettes, which `ui-tokens.md` records as a deliberate split, not drift.

## Decisions made

- **Gold (`#C6A664`) became `--rating-star` directly**, not a new `--gold-*` family. This was chosen over adding a separate brand-gold token set (which would have pushed component files into scope) and over leaving `--rating-star` at its old `#F2A93B`. It also dissolves the collision the plan flagged: gold no longer sits next to a warm brand accent because the brand accent is teal now, so `ui-tokens.md`'s "gold must stay separate from the brand accent" argument holds automatically.
- **`--bg-subtle` needed its own value, not a same-family port.** First pass matched `--bg-base`'s warm→cream move (`#F5F1E8`), but rendered live it read pink — `bg-subtle` is dominated by input fills (98 call sites, mostly `border-border-default bg-subtle`), so a warm fill inside the new cool border was the one thing on screen still looking like the old palette. Settled on `#F4F4F1` after screenshotting three candidates side by side on the login form.
- **Success and warning were retuned, not hue-preserved.** Old values (`#1F9D63`, `#C97A1B`) were chosen for distance from *terracotta*; that reasoning doesn't transfer to teal. Success → `#15803D` (greener, so a Confirmed badge can't read as the same family as a teal CTA — verified against all five real booking statuses side by side). Warning → `#B45309` (off the new rating gold). Error and info left alone.
- **Theme renamed to Coastal Hospitality** — confirmed with the developer during planning, not assumed.
- **Verification driven against the local dev DB, not production** — production seeded clean and has no bookings to look at; local dev DB has real data to walk `/bookings`, `/checkout`, `/favorites` against.

## Problems solved

- **Auth couldn't be driven through the login form via Playwright** (URL stayed on `/login` after submit) — worked around by signing in directly against `POST /api/auth/sign-in/email` and letting Playwright's request context carry the resulting session cookie into the browser context. Faster and more reliable than the form anyway.
- **No seeded user had both a login and real bookings/favorites** — the Google-auth user had data but can't be driven headlessly; credential users had none. Fixed by signing up a fresh `palette-check@example.com` credential user, then reassigning 5 existing bookings (one per status: `pending_payment`, `confirmed`, `completed`, `cancelled`, `failed`) and 4 favorites to it via direct SQL against the local DB.
- **A "warm smudge" scare on `/checkout` turned out to be test data, not the palette** — the reassigned booking carried a stale Stripe `payment_intent` from its original owner, so the Payment Element failed to mount with `No such payment_intent`. Confirmed unrelated to Feature 53: `CheckoutForm.tsx`'s `<Elements>` provider has never had an `appearance` config, so the Payment Element has always rendered in Stripe's own default theme under both palettes. Logged as a pre-existing gap, left out of scope.
- **A pre-existing doc bug**: `ui-tokens.md`'s bottom CSS reference block showed the three `--shadow-*` living in `:root`; both `frontend/app/globals.css` and `frontend-admin/src/index.css` actually register them in `@theme inline`. Fixed in both the frontend-admin reference block and the new frontend block while already in the file.

## Current state

`pnpm build` and `npx tsc --noEmit` both clean. Working tree has one untracked file, `frontend/public/home-banner.webp` (the developer's Feature 54 asset, deliberately left uncommitted — not part of this feature). Branch `feature/52-email-send-throttle` is 2 commits ahead of where Feature 52 left it (6 ahead of `main` total), unpushed.

Verified against the real running app on `localhost` (local backend against local dev DB): walked home, search, hotel details, bookings, favorites, compare, checkout, `/assistant`, and the chat widget at mobile/tablet/desktop widths. A Playwright pass additionally scanned every element's computed styles on each route for any of the old palette's 17 warm RGB values — zero hits anywhere, both before and after the `--bg-subtle` fix. `frontend-admin/` confirmed unchanged by inspection and by the one-file diff.

**Local dev DB now has extra test data**: a `palette-check@example.com` credential user with 5 reassigned bookings and 4 reassigned favorites. Harmless and consistent with existing seed clutter already noted in `progress-tracker.md` (Temp User 1, Widget Tester accounts) — not cleaned up, matching precedent that dev-DB leftovers don't block anything.

Context updated: `ui-tokens.md` (full re-derivation — backgrounds, borders, text, accent, ratings, status, shadows, both apps' reference CSS blocks now shown separately) and `progress-tracker.md` (status, checklist, Completed Features entry, session note, two new Open items: Feature 53 not yet deployed, and the Stripe `Elements` appearance gap).

## Next session starts with

**Feature 54 — homepage banner.** `frontend/public/home-banner.webp` already exists, so the "does not start until the file exists" blocker in `iteration-plan.md` is cleared. Replace the `HotelIcon` placeholder in `frontend/app/page.tsx` with `next/image`, `priority` (LCP element), explicit `sizes`, real `alt`. Preserve `aspect-[4/3] rounded-3xl overflow-hidden` and the `lg:-mt-16` negative margin that pulls `HeroSearchWidget` up over it — both break easily. Check `next.config.ts` — no `images` block exists yet; a local file needs none, but confirm before assuming.

Carry-overs, unchanged from last session:

1. **Apply migration `0005` to production** before or with deploying Feature 52's code — every auth email throws against a missing table otherwise.
2. **Feature 53's CSS change is also undeployed** — a Vercel push is all it needs, no migration involved, but production is still on terracotta until then.
3. **Decide what happens to `feature/52-email-send-throttle`.** Still one merge away from `main`; now carries both Features 52 and 53.

## Open questions

- Everything carried from Feature 52's memory (20-minute window tunability, the accepted send race, the `better-auth` version mismatch between `backend`/`frontend`, missing env vars in `code-standards.md`'s table) — untouched this session, still open.
- Whether `--border-strong` (`#9CA3AF`) and `--rating-star-empty` (`#DCE0E5`) are exactly right, or just close — these were the two values I was least sure of during derivation and flagged as most likely to need a second look; nothing in the walkthrough showed a problem, but they weren't stress-tested against a dense UI the way `--bg-subtle` was.
- Whether `success` (`#15803D`) and `warning` (`#B45309`) read right against `--state-info` (`#2E7BC4`, unchanged) once all three appear close together — the Bookings page showed all five at once and they read fine, but no other page stacks that many status colors together.
