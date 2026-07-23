# Memory — Feature 43 Widget Graph built and verified, uncommitted

Last updated: 2026-07-23 14:30

## What was built

**Feature 43 Widget graph, complete and verified.** The first LangGraph agent in the project and the first streaming route. Agent-side brain plus the `backend/` pipe that carries it. **No UI, no tables, no migration, no new dependency** — Feature 44 owns `chat_sessions`/`chat_messages` and every component.

New — `agent/` (10 files): `streaming/events.py` (SSE vocabulary, defined once), `schemas/chat.py`, `api/chat_widget_routes.py`, and `graphs/chat_widget/` holding `state.py`, `prompts.py`, `nodes.py`, `graph.py`, `tools/search_tools.py` plus the package `__init__.py` files. Modified: `api/router.py`.

New — backend (6): `services/filter-vocabulary.service.ts`, `services/internal-search.service.ts`, `controllers/internal/search.controller.ts`, `routes/internal/search.routes.ts`, `types/chat.schemas.ts`, `types/internal-search.schemas.ts`.

Modified — backend (8): `config/env.ts`, `.env.example`, `middlewares/rateLimit.ts` (new `chatRateLimit`), `services/ai.service.ts` (new `streamFromAgent`), `controllers/ai.controller.ts` (new `streamWidgetChat`), `routes/ai.routes.ts` (rewired), `routes/index.ts`, `services/search-extraction.service.ts` (`resolveNames` lifted out).

Modified — `context/` (5): `progress-tracker.md`, `architecture.md`, `ai-phase-plan.md`, `library-docs.md`, `code-standards.md`.

The graph is `prepare_context → agent ⇄ tools` with five tool schemas: `SearchHotels`, `GetHotelDetails`, `ProposeSearch`, `ProposeHotel`, `ProposeCompare`.

## Decisions made

Each is written up in full in `context/progress-tracker.md`'s Feature 43 entry — pointers only here.

- **`sessionId` comes from `backend/` and is used as the checkpointer `thread_id` verbatim.** `widget:{userId}` today, `chat_sessions.id` in Feature 44, **zero Python changes between them.**
- **A hotel id never enters the model's token stream.** Tools return names, `state.hotel_ids` records the ids they saw, and the graph maps a model-chosen name back to a real id when building a chip. Keeps Feature 40's no-uuid invariant while still shipping chips that need a uuid.
- **Chips carry filters as names, never a URL.** Supersedes `architecture.md`'s "the AI writes a URL". The frontend maps names to ids from its own catalog and pushes the URL via the existing `toSearchState`.
- **`GET /internal/search` takes filter names**, resolves them, and delegates to an untouched `search.service.ts`. `pageSize` defaults to 5, caps at 10 — every result is spent as model context.
- **`aiRateLimit` moved from `router.use()` to the three public `/ai` routes individually**, so chat can carry a user-keyed `chatRateLimit`. **Supersedes point 2 of the Phase 11 inheritance list** — a new `/ai` route is no longer covered automatically and must name its own limiter.
- **Context is assembled per call and never persisted into history.** A stale block becomes structurally impossible rather than merely labelled.
- **Tool loop capped at 4 rounds by unbinding the tools** (not by raising), with `recursion_limit: 12` behind it. Worst case is 5 model calls per user message.

## Problems solved

- **`stream_mode="messages"` emits every message a node produces, not just LLM output.** Raw tool results were streaming to the client as assistant prose. Fixed by filtering on `AIMessageChunk`. This is not documented obviously and will bite any future graph.
- **The context block must go LAST, after the message history.** Placed right after the system prompt it gets buried by a long conversation: asked "how much is this one?" on a newly opened hotel page, the model answered about the *previous* hotel, then corrected itself. Moving it to the end fixed it immediately. **Do not tidy it back up next to the system prompt.**
- **A ReAct model writes its answer, calls a tool, then writes the same answer again.** Prompt wording reduced it but never eliminated it. Solved structurally: `token` events carry the id of the reply they belong to and a `drop` event retracts one. **Feature 44 must group by `id` and honour `drop` or users see duplicate paragraphs.**
- **LangGraph 1.2.9 defaults `recursion_limit` to 10007** (`langgraph/_internal/_config.py:32`), not the 25 older versions used. The framework provides no useful loop ceiling — assume none exists.
- **The model invented a currency** (`€320` where the app renders `$320`) because the tool output carried a bare number. Fixed by putting `USD` in the tool output and a currency rule in the prompt.
- **`AGENT_BASE_URL=... pnpm dev` does not override the value in `backend/.env`** — dotenv wins. An attempt to point the backend at a stub SSE server silently hit the real agent instead, costing two unintended paid model calls. Edit `.env` or use a different mechanism.
- **The seed has no Swimming Pool on any hotel**, though the amenity exists in the catalog. The plan's flagship phrase "cheaper ones with a pool" returns nothing. Use Gym (4 hotels), Restaurant/Bar/Air Conditioning (3), Parking (2) or Spa (1) for demos.
- **`ai-phase-plan.md`'s widget position cites a precedent that does not exist.** It says `fixed bottom-6 right-6`, "same as the Compare Tray", but the registry records the Tray as `fixed bottom-4 inset-x-0 mx-auto max-w-3xl` — centred, not right-aligned. They can also **overlap** around 800–900px viewport width, and both persist across pages. Recorded as a Feature 44 pre-condition.

## Current state

- **Features 36–43 complete. Phase 13 is in progress** — only Feature 44 remains in it.
- Verified against the real running stack and the real seeded database: internal search (401 without secret, name-resolved amenity filtering, invented names returned in `unresolvedFilters`, anchor + distances, page-size cap), widget turns over SSE (real tool calls, multi-turn memory, context following navigation, stale reference resolved, booking/payment refused, out-of-domain refused, chips carrying ids the model never saw), and through `backend/` (logged-out 401, `RateLimit-Limit: 15` proving the user-keyed limiter, correct SSE headers, tokens arriving incrementally rather than buffered). Chip dedupe and loop termination covered by a direct no-LLM test, 5/5.
- Backend `pnpm build` clean, agent `ruff check` + `ruff format --check` clean. `frontend/` untouched.
- **All 21 code files plus 5 context files are uncommitted.** Working tree dirty; local `main` and `origin/main` both at `138e476`.
- **The LLM model was changed mid-session by the developer to `qwen/qwen3.5-flash-02-23` in both slots** (fast and smart). It is a paid model. It **loops** where the previous free Nemotron did not — one message produced 51 assistant turns — which is what prompted the tool-loop cap.
- **The tool-loop cap and chip dedupe are unit-verified but have not had one live run on qwen.** The developer asked to stop spending tokens on testing, so this is the one gap.
- A throwaway user `widget-probe@example.com` exists in the dev database from session-cookie testing.
- No dev servers left running; ports 4000/4100 released.

## Next session starts with

**Commit Feature 43, then start Feature 44.**

Commit in three parts per the standing one-commit-per-concern rule — stage by path, do not squash. There is **no frontend commit this time**:

1. `agent/` — the widget graph, tools, SSE vocabulary, chat route
2. backend — `/internal/search`, `chatRateLimit`, `streamFromAgent`, the `ai.routes.ts` rewiring
3. `docs(context)` — the five context files

Then **Feature 44 Widget persistence + UI** — read `context/ai-phase-plan.md`, not `build-plan.md`. Four things it must honour, all listed at the top of `progress-tracker.md`:

1. Group `token` frames by their `id` and honour `drop`, or the user sees duplicate prose.
2. Chips carry filter **names**; map to ids from `useSearchCatalogs` then go through the existing `toSearchState`. `open_hotel`/`compare` chips already carry a resolved `hotelId`.
3. Send `sessionId` as the real `chat_sessions.id` in place of `widget:{userId}`.
4. Resolve the widget-vs-Compare-Tray position conflict before building. Follow the **Floating Compare Tray** for elevation (`shadow-elevated`), not the **Panel** entry.

Worth doing early and cheaply: one live widget turn on qwen to confirm the tool-loop cap behaves as designed.

## Open questions

- **Does the tool-loop cap hold on qwen in practice?** Logic is unit-verified; one real turn would confirm the unbind-at-4-rounds path.
- **Is `qwen/qwen3.5-flash-02-23` the right model for the widget?** It loops without a cap and is paid. The fast/smart split exists in `settings.py` precisely so the two can differ — currently both slots hold the same model.
- **Widget vs Compare Tray stacking** — tray above bubble, or bubble offset upward when the tray is open?
- **`Architecture Decisions` and `Session Notes` in `progress-tracker.md` have been dormant since 2026-07-19** — Features 36–43 all put everything in `Completed Features` instead. Revive them or mark them retired; right now they read as neglected.
- **Carried over, unrelated to 43:** `trust proxy` must be settled at deployment or the IP-keyed `aiRateLimit` is effectively disabled in production. S3 credentials still blank in this dev environment (open since Feature 07). The Feature 16 rating-consistency question is still open.

## Note on secrets

No credentials, tokens, keys, cookies or connection strings are recorded in this file. `OPENROUTER_API_KEY`, `INTERNAL_SERVICE_SECRET`, `DATABASE_URL`, `MAPBOX_ACCESS_TOKEN`, `S3_*` and the test account's password are referred to by name only, never by value.
