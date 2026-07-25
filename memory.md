# Memory — Feature 46 Mutating tools, complete, verified, committed

Last updated: 2026-07-25

## What was built

**Feature 46 Mutating tools, complete and verified.** The four tools that write on the user's behalf, each pausing at `interrupt()` before it touches anything, plus the four backend routes they call. **No graph, no prompt, no UI** — Feature 47 assembles the agent, Feature 48 builds `/assistant` and the confirmation card.

New — agent: `graphs/chatbot/tools/booking_tools.py` (`BookRoom`, `CancelBooking` + runners), `graphs/chatbot/tools/confirm.py` (`confirm`, `_is_approved`, `DECLINED`). Modified: `account_tools.py` (adds `AddFavorite`, `run_add_favorite`, `find_booking_by_name`, `unknown_booking`), `review_tools.py` (adds `WriteReview`, `run_write_review`), `tools/outcome.py` (adds `action`).

New — backend: four routes only, all thin wrappers over existing services. `POST /internal/bookings`, `POST /internal/bookings/:id/cancel`, `POST /internal/bookings/:id/review`, `POST /internal/favorites`. Modified: `controllers/internal/bookings.controller.ts`, `controllers/internal/favorites.controller.ts`, and both internal route files. No table, no migration, no new dependency, no new env var.

Modified — context: `progress-tracker.md`, `ai-phase-plan.md`, `architecture.md`, `code-standards.md`, `library-docs.md`, `ui-rules.md`.

## Decisions made

- **`interrupt()` lives inside the tool runner, not the graph.** `_preview` (reads only) → `confirm(...)` → commit. The gate is structural, so Feature 47 cannot wire up the agent and forget it. The alternative — pure `preview_*`/`commit_*` with the pause in 47's tool node — was rejected for making the single most important safety property depend on a later feature remembering it.
- **Mutating tools resolve a name by re-fetching; they never read an id map.** `BookRoom` re-reads `/hotels/:id/room-types` for the exact dates; `CancelBooking`/`WriteReview` re-read `/internal/bookings` and rebuild the key map with `unique_booking_key`. This routes around a real bug in Feature 45's `room_type_ids`, which is keyed by **bare room name** and so collides across hotels — the same flaw `booking_ids` had before the `(booking 2)` suffix. The map is left as-is and simply not used for booking. Re-fetching also prices and checks inventory at the moment of confirmation, and works on turn one before any read tool has run.
- **One generic `interrupt()` envelope for all four** — `{action, title, lines: [{label, value}], confirm_label}`. Resume value is `{"approved": bool}`; a bare boolean is accepted; **anything else counts as a refusal**. Feature 48 therefore builds one confirmation card, not four.
- **The checkout link rides on `ToolOutcome.action`**, `{"kind": "checkout", "label", "path": "/checkout/<id>"}` — never in model-facing text. The model is told only that the link is on screen. **The path is relative**, so `agent/` needs no `FRONTEND_URL`: Feature 48 runs in the frontend and knows its own origin.
- **All four stay gated, including favorites** — `code-standards.md` and `library-docs.md` both say no exceptions. Favoriting an already-saved hotel short-circuits without pausing; that is the only concession. No `RemoveFavorite`, no review edit or delete.
- **Tools went where their domain lives**, not all into `booking_tools.py`: `AddFavorite` beside `ListMyFavorites`, `WriteReview` beside `GetHotelReviews`. The Feature 45 hand-off note's real point was *never `src/tools/`*, which still holds absolutely.

## Problems solved

- **`interrupt()` re-runs its whole node from the start on resume** — read out of the installed package, not assumed. Two consequences, both load-bearing: everything before a pause must be a repeatable read (all four runners are, by construction), and **a node must dispatch at most one mutating tool call**, or an already-committed sibling call re-commits on resume. The second is Feature 47's problem and is recorded there.
- **The internal routes cannot carry the public `emailVerified` guard**, which reads `req.user`; the internal guard only ever receives a user id. Deliberately not solved by adding a user lookup — that would make a thin wrapper into business logic. Nothing is exposed today because no chatbot route exists. Feature 47's route must gate on it.
- **Suspected gap that turned out not to exist:** an invalid party size confirming and *then* 400ing. It cannot — `/hotels/:id/room-types` validates `adults ≥ 1`, `kids ≥ 0`, `rooms ≥ 1` with the same bounds as `createBookingSchema`, so the preview fetch raises before any pause. Verified live: `adults=0` returns `400: Number must be greater than or equal to 1`.
- **Verification consumes real data, so it has to be restored.** The dev account (`0Vy0tyP6Ig4oICjops1awWpDdj93M3Di`) has exactly **one** completed unreviewed booking, so the `WriteReview` happy path is a single shot. Restore in one transaction: delete the review and reset that hotel to `review_count`/`average_rating` `0|0`, set the cancelled booking back to `confirmed`, delete the `pending_payment` bookings created, delete the favorite, and clear the harness's checkpointer threads from `agent.checkpoint_writes`/`_blobs`/`checkpoints`.
- **`round()` differs between the two implementations of the booking total.** Python's is banker's, JS's `Math.round` is half-up — `round(2.5)` is 2 in Python, 3 in JS. Only reachable with a fractional price, and every price is currently a whole number. Left unfixed; the success message already reports the backend's committed total rather than the previewed one.

## Current state

- **Everything works and is verified.** A throwaway one-node graph over the real `PostgresSaver` drove every runner against the real backend and seeded DB. Each of the four: paused with the right card → resumed `approved: false` → returned `DECLINED` and wrote nothing → paused again → resumed `approved: true` → committed, confirmed by direct SQL. Every rejection refuses **before** pausing: unknown room name (lists what the hotel does offer), backwards dates, unknown booking name, cancelling a `cancelled` and a `pending_payment` booking, reviewing a `confirmed` stay, rating 9, blank description, double review. `BookRoom`'s previewed total (USD 960) matched the committed total exactly.
- **Zero uuids in any model-facing text**, regex-checked on every path; the only uuid is inside `action.path`.
- **The widget is untouched and still safe** — 5 bound tools (`SearchHotels`, `GetHotelDetails`, `ProposeSearch`, `ProposeHotel`, `ProposeCompare`), no import from `graphs/chatbot/` anywhere in it. The chatbot's full surface is 11 tools.
- **All verification data was restored** and confirmed back to 9 bookings (3 confirmed, 1 completed, 5 cancelled), 0 reviews, 2 favorites. The scratch harness was deleted.
- Checks clean: `ruff check` + `ruff format --check` (agent), `pnpm build` (backend).
- **All ten context files audited**, six updated. `build-plan.md`, `project-overview.md`, `ui-tokens.md`, `ui-registry.md` verified as needing nothing — Feature 46 built no UI, so there is nothing to imprint; `/imprint` is next due after Feature 48.
- **Committed in four parts** — `feat(backend)`, `feat(agent)`, `docs(context)`, `chore` for this file — and pushed to `origin/main`.

## Next session starts with

**Feature 47 — Agent assembly.** Single ReAct agent + tool node (not a multi-agent supervisor) + guardrail system prompt: no fabricated prices or availability, everything real-time via tools, out-of-domain requests refused. Read `ai-phase-plan.md`. **Two obligations Feature 46 hands it, both correctness bugs if missed:**

1. **The chatbot's `/ai` route must reject an unverified email**, the way `createBooking`'s controller does. `requireAuth` does not check it and the internal route cannot.
2. **The tool node must dispatch at most one mutating tool call per node execution**, because `interrupt()` resumes by re-running the node from the start.

Also inherited: bind the 11 tools, cap the tool loop (the model loops — Feature 43 saw 51 assistant turns from one message), and surface `ToolOutcome.action` plus the `interrupt()` payload onto the SSE vocabulary already defined in `streaming/events.py`.

## Open questions

- **Three Minor review findings, deliberately left unfixed** after `/review` and confirmed with the developer: `int()` called on an `object`-typed arg at `review_tools.py:72` and `booking_tools.py:109`/`:116`; `find_booking_by_name` passing `dict[str, dict]` into `unique_booking_key(taken: dict[str, str])` (runtime-correct — only key membership is tested); and the banker's-vs-half-up rounding above. All are Pyright/Pylance complaints only — **`agent/` has no type checker configured**, ruff alone is the gate and it passes. Fixing them would change edge-case behaviour and invalidate the verification pass, which burns the single reviewable booking again.
- **Test-data deletion is still unauthorized** — asked three times now. "Temp User 1" (`xiton98335@buloan.com`) holds 18 bookings; `widget44-*` test users and a leftover widget thread remain. `ListMyBookings` reads all of it, so Feature 51's evals will surface it verbatim.
- **Should `seed.ts` call `recalculateHotelRatingStats` after inserting reviews?** Without it every seeded hotel reports zero reviews through search, details, compare and favorites while `GetHotelReviews` correctly returns them. Confirmed again this session: every hotel reads `0|0`, including Hotel Marais Charme which has 6 real reviews.
- **The Feature 16 rating-scale inconsistency is still open** (1–5 stored, 0–10 displayed). Features 45 and 46 both sidestep it.
- Standing item: `trust proxy` must be settled at deployment or the IP-keyed `aiRateLimit` is disabled in production (Phase 16).
