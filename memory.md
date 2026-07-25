# Memory — Feature 45 Read-only tool suite, complete and verified, uncommitted

Last updated: 2026-07-25

## What was built

**Feature 45 Read-only tool suite, complete and verified.** The seven read-only tools the chatbot will bind, plus the one backend route needed to serve them. **No graph, no prompt, no UI** — Feature 47 assembles the agent, Feature 48 builds `/assistant`.

New — backend: `controllers/internal/favorites.controller.ts`, `routes/internal/favorites.routes.ts`. Modified: `routes/index.ts` (mounted `/internal/favorites`). That is the entire backend change — no table, no migration, no new dependency in any app.

New — agent, shared by both surfaces (`src/tools/`): `search_tools.py` (`SearchHotels`, `GetHotelDetails` + runners, `SEARCH_PARAM_NAMES`, `to_search_params`), `describe.py` (`rating_phrase`, `amenity_line`, `count_phrase`), `outcome.py` (`ToolOutcome`).

New — agent, chatbot only (`src/graphs/chatbot/tools/`): `search_tools.py` (`GetRoomTypes`, `CompareHotels`), `review_tools.py` (`GetHotelReviews`), `account_tools.py` (`ListMyBookings`, `ListMyFavorites`, `booking_key`, `unique_booking_key`).

Moved — agent: `graphs/chat_widget/tools/search_tools.py` **deleted**, replaced by `widget_tools.py` holding only the three chip proposals, `to_chip_filters`, and the widget's `TOOL_SCHEMAS`. `graphs/chat_widget/nodes.py` imports updated. Nothing else in the widget changed.

Modified — context: `progress-tracker.md`, `ai-phase-plan.md`, `architecture.md`, `code-standards.md`, `library-docs.md`.

## Decisions made

- **Tool placement (the developer's rule, given mid-session — follow it for every future tool).** `agent/src/tools/` holds **only** tools that *both* the widget and chatbot bind. A tool one feature owns lives in that feature's own `graphs/<feature>/tools/`. Today only `SearchHotels` + `GetHotelDetails` are shared. This **supersedes the `ai-phase-plan.md` folder sketch**, which had the chatbot importing from the widget's folder — backwards, since the widget is the restricted subset. It makes the widget's safety property *structural*: `ListMyBookings` is not importable from where the widget builds `TOOL_SCHEMAS`.
- **Only `/internal/favorites` was added to `backend/`.** Hotel details, room types, compare, and hotel reviews are unauthenticated public reads and `agent/` calls them directly (precedent set in Feature 43). Favorites is the exception because `GET /favorites` resolves its owner from cookies, which `agent/` cannot send.
- **No `GET /hotels/nearby` route and no nearby tool.** `near` on `GET /internal/search` already anchors on a hotel/city/district and returns distance-ordered results with `distanceKm` and an `anchor` label. "nearby" is a `SearchHotels` argument, not a capability.
- **`ToolOutcome(text, hotel_ids, room_type_ids, booking_ids)`** — text for the model, id maps for the graph. The two new maps exist because Feature 46's mutating tools need a room type and a booking the model must never name by id. Deliberately **no structured card payload yet** — Feature 48 adds it once the card shape is known.
- **A booking is named `"{hotel name} checking in {check-in date}"`**, with a `(booking 2)` suffix appended on collision. No human-readable reference code exists on the table and adding one is a migration plus UI surfacing.
- **`GetRoomTypes` is its own tool**, not part of hotel details — room data is dates-and-party dependent and only worth fetching once the conversation turns to booking. `GetHotelDetails` deliberately does not mention it, so the widget's model is not told about a tool it cannot call.
- **"reviews" means a hotel's guest reviews**, not the user's own written ones.
- **Ratings are reported with no denominator** (`guest rating 4.6 from 12 reviews`). Applied to the two moved Feature 43 functions too, rather than leaving two conventions in one file. Revertible in one line if the developer disagrees.
- **Empty `__init__.py` is this project's convention** — the aggregate "which tools does the chatbot bind" list is Feature 47's job, not 45's. Each tool module exports its own `*_TOOL_SCHEMAS`.

## Problems solved

- **The booking natural key collides in real data — found by verification, not by reasoning.** The dev account holds two bookings at Hotel Marais Charme and three at Shibuya Sky Hotel all checking in on the same date. `booking_ids` collapsed them last-write-wins, so Feature 46 would have cancelled the wrong booking. Fixed with `unique_booking_key`, which appends `(booking 2)` / `(booking 3)`; the suffixed key is printed in the text so the model can echo it back. 9 bookings now yield 9 distinct keys.
- **Seeded hotels report "no guest reviews yet" even when they have reviews.** `seed.ts` inserts reviews directly and never calls `recalculateHotelRatingStats`, so `hotels.review_count`/`average_rating` stay 0. Hotel Marais Charme has 6 real reviews. `GetHotelReviews` returns all six correctly; search/details/compare/favorites all say none. **Not fixed — it is a seed change.**
- **The rating scale is genuinely inconsistent (the open Feature 16 question).** `hotels.average_rating` is `AVG(reviews.rating)` over a 1–5 check-constrained column, but `frontend/features/search/lib/guest-rating.ts` treats the same number as 0–10 ("Excellent" at ≥9), and Feature 43's tools labelled it `/10`. Feature 45 does not resolve the scale, it just stops asserting one.
- **`__init__.py` files here are empty by convention** — a first attempt put an aggregate export in `src/tools/__init__.py` and it was reverted to match.
- **Scratch scripts must live inside the app they import from.** A backend DB probe belongs in `backend/` (relative `./src/config/db`), an agent tool probe in `agent/` (run with `uv run python`). Both were deleted after use.
- **`zsh` needs `--include="*.ts"` quoted** in `grep -r`, or it globs and fails with "no matches found".

## Current state

- **Everything works and is verified.** All seven tools were invoked directly against the real running backend and the real seeded DB: search by destination; search with `near` (anchor resolved, `0 km away`) and an unknown amenity (correctly reported as ignored); details; room types for 2026-08-10→14 with real prices and remaining inventory; compare of two Paris hotels; reviews (5 of 6, real names and text); 9 bookings → 9 distinct keys; 2 favorites through the new internal route. **Zero uuids in any model-facing text**, checked by regex over every output.
- **The widget was re-verified over HTTP after the refactor**, on a restarted agent: a live turn ran `SearchHotels`, streamed tokens, emitted `drop`, and resolved both chips to a real `hotelId`. Asked "what are my bookings?" it called **no tool at all** and said it could not see them — proving the placement rule holds.
- Checks clean: `ruff check` + `ruff format --check` (agent), `pnpm build` (backend).
- **All ten context files audited.** Five updated. `code-standards.md` and `library-docs.md` were missed on the first pass and caught on a second audit; `progress-tracker.md`'s Phase 14 checkbox was missed and caught on a third. `build-plan.md`, `project-overview.md`, `ui-rules.md`, `ui-tokens.md`, `ui-registry.md` verified as needing nothing.
- **NOT committed.** Working tree holds all Feature 45 changes plus the doc updates.
- Dev servers running: backend :4000, agent :4100 (restarted this session so it picks up the refactor). Frontend was not needed.

## Next session starts with

1. **Get the developer's go-ahead, then commit in three parts:** `feat(backend)`, `feat(agent)`, `docs(context)`. Committing was not authorized this session.
2. **Clear the test data** — still needs explicit permission, flagged since Feature 27 and never granted. "Temp User 1" (`xiton98335@buloan.com`) holds **18 bookings**; test users `widget44-*` / `widget44b-*` / `widget-probe@example.com` remain in the dev `user` table; a leftover widget thread sits in `chat_sessions`/`chat_messages`. `ListMyBookings` reads all of it, so any chatbot eval will surface it verbatim.
3. **Feature 46 — Mutating tools** (booking, cancel, favorite, review), each `interrupt()`-gated. Read `ai-phase-plan.md`. It inherits 45's id maps and must not add an id argument to any tool schema. **Booking never takes payment in chat:** `createBookingForUser` creates a `pending_payment` row that holds inventory in a transaction, and a booking only ever reaches `confirmed` via the Stripe webhook — so the tool hands off a checkout link. The confirmation-card UI for the `interrupt()` pause is Feature 48, not 46. Mutating tools go in `graphs/chatbot/tools/booking_tools.py`, never `src/tools/`.

## Open questions

- **Test-data deletion is still unauthorized** — asked twice, not yet answered. Blocking nothing today, but it will corrupt Feature 46 and Feature 51 evals.
- **Should `seed.ts` call `recalculateHotelRatingStats` after inserting reviews?** Without it the eval prompt *"Which of these two has better reviews?"* is unanswerable from the aggregate. Worth settling before Feature 51.
- **The Feature 16 rating-scale inconsistency is still open** (1–5 stored, 0–10 displayed). Feature 45 sidesteps it; something eventually has to pick a scale.
- Standing item: `trust proxy` must be settled at deployment or the IP-keyed `aiRateLimit` is disabled in production (Phase 16).
