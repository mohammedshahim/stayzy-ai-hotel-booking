# AI Phase Plan

Companion to `build-plan.md`, covering Features 36–51. Read `architecture.md`, `code-standards.md`, and `progress-tracker.md` before starting any feature here — this file adds to them, it does not replace them.

Agreed with the developer during `/architect` on 2026-07-19. Every decision below is confirmed unless explicitly marked as an assumption.

---

## Sequencing (supersedes `build-plan.md`'s original order)

`build-plan.md` originally scoped the AI phase to start only after Phase 9 (Deployment) shipped. That is now flipped: **the AI phase (Phases 10–15) runs first, and Phase 9's deployment work runs last, as Phase 16.**

Reasoning: Features 31–35 have not been executed, so there is nothing live to disrupt. Deploying once — after the product is feature-complete with AI included — avoids standing up production infrastructure twice and avoids an intermediate live deployment that goes stale the moment Phase 10 starts.

**Feature ID numbers are unchanged** from `build-plan.md`/`progress-tracker.md` (31–35 deployment, 36+ AI). Only execution order changes. `progress-tracker.md`'s Current Status is always the authority on what is actually next.

---

## Corrections to the original draft

These were verified against the codebase during `/architect`. The first two change feature scope.

**The "reserved AI slots" mostly do not exist.**

| Surface | Reality |
| --- | --- |
| `/compare` | Slot **exists** — `frontend/features/compare/components/CompareTable.tsx:131-134`, a static `hidden` div. Feature 39 unhides and wires it. |
| `/hotels/[id]` | **Built in Feature 38.** `HotelSummarySection.tsx`, mounted in `HotelDetailsContent.tsx` between the description and `AmenitiesList`. The audit was right: no slot had existed. |
| Search sidebar | **Nothing exists.** `FilterSidebar.tsx` has seven filter sections and no free-text input. Feature 41 must build it. |

**Migrations follow a convention the original draft missed.** Not `backend/migrations/000X_*.sql` + `schema_migrations`. The real mechanism is drizzle-kit generating into `backend/drizzle/`, tracked in `drizzle.__drizzle_migrations`. Critically, **every migration must ship a hand-written `.down.sql` sibling** — `backend/src/config/migrate-down.ts:48-53` refuses to roll back without one. All four new tables need them.

**Feature 42 is smaller than it looks.** `findSimilarHotels` (`backend/src/queries/hotels.queries.ts:146-174`) already builds a `referencePoint` geography and orders by `ST_Distance`. It filters by exact city/country equality. Generalizing it is swapping one clause for `ST_DWithin` — the PostGIS plumbing already exists.

It does expose a latent bug to fix in the same feature: **`sort: "distance"` has no reference point today.** It sorts against the centroid of the result set using a JS haversine (`backend/src/services/search.service.ts:57-92`). Once a real anchor exists, that becomes a proper SQL ordering.

**Deviation from `project-overview.md`: the vector database is dropped.** The original scope listed "vector-database-backed nearby-hotel search." This phase uses PostGIS + LLM query extraction instead. A GiST index and working geography queries already exist; a vector DB would add a dependency for a problem PostGIS already solves. Recorded here as a deliberate deviation, not drift.

---

## Architecture Decisions

**`agent/` is a fourth app** — Python, FastAPI + LangGraph. It is never called by either frontend. The existing invariant "`backend/` is the only service either frontend talks to" extends to it: every AI feature is reached as a `backend/` route that internally calls `agent/`.

**`agent/` owns no product data.** It receives context in a request payload from `backend/` and returns generated output. Caching, chat history, and all business logic stay in `backend/`'s Postgres via Drizzle — the same pattern every other feature uses.

**The one exception is the LangGraph checkpointer**, keyed by `thread_id` (= `chat_sessions.id`), persisting execution state across turns. Same database as `backend/`, separate schema, created by the checkpointer library's own `.setup()` — never Alembic, never a hand-rolled migration.

**`PostgresSaver` from Feature 36, in every environment.** The original draft used `InMemorySaver` in dev and swapped to `PostgresSaver` in Feature 49. That swap is not a no-op: in-memory state dies on process restart, so a paused `interrupt()` confirmation silently evaporates in dev in a way it will not in production — discovered only after the hardest feature is already built. Postgres already runs locally. **Feature 49 is deleted.** `InMemorySaver` is retained for tests only.

**Mutations never write directly.** The chatbot's mutating tools call `backend/`'s new `internal/*` routes, which are thin wrappers around existing services. `agent/` never touches product tables.

**Service auth is a shared secret, not a JWT.** `x-internal-secret` compared with `crypto.timingSafeEqual`, plus an explicit `x-acting-user-id` header — the exact precedent set by `backend/src/middlewares/requireCronSecret.ts:13-20`. A JWT would buy tamper-evidence on the user id, but `agent/` is a trusted first-party service; if it is compromised it can mint whatever it wants either way. No signing library, no rotation, no clock skew.

**The frontend never talks to `agent/`, and `agent/` never sees a user session cookie.**

**Money-moving actions stop at a `pending_payment` booking.** The chatbot hands back a `/checkout/[bookingId]` link and never collects payment details. Stripe Elements remains the only payment surface, per the existing invariant that a booking confirms only via webhook.

**LLM provider is OpenRouter**, provider-agnostic, model selected per use case in config. A cheap fast model for summaries and query extraction; a stronger one for the chatbot's tool loop.

**Per-user rate limiting lands in Feature 37, not Feature 50.** Metered spend begins at Feature 38; leaving the cost ceiling to the last phase means four billable features run unbounded in between.

**Corrected 2026-07-20 (Feature 37):** the *mechanism* shipped in 37, but the mount that actually caps spend cannot live on `internal/*`. That direction is `agent/`→`backend/` and costs nothing — and limiting it throttles a chatbot turn's tool loop while leaving summary generation (zero internal calls, real money) unbounded. **Every feature that adds an inbound AI route must attach a limiter to it**, starting with Feature 38. `middlewares/rateLimit.ts` is the reusable piece.

---

## Streaming

Chat replies (widget and chatbot) stream. Every other AI feature — summaries, query extraction — returns plain JSON through the existing `lib/api-client.ts`.

The design keeps streaming from infecting the codebase by making the stream carry **presentation only**. Three hops, one responsibility each:

**`agent/` emits SSE.** FastAPI `StreamingResponse` over `graph.astream(..., stream_mode="messages")`, emitting typed JSON events. One event vocabulary shared by both surfaces; the chatbot simply handles more of the types:

```
{type:"token", text}          → append to the in-flight assistant message
{type:"tool_start", name}     → render the tool-status chip
{type:"tool_end"}             → clear the chip
{type:"action", action}       → a navigate / compare-toggle proposal (widget)
{type:"interrupt", payload}   → render the confirmation card (chatbot)
{type:"done", messageId}      → finalize
{type:"error", message}       → render inline error + retry
```

**`backend/` is a dumb byte pipe.** It authenticates the user session, opens the upstream request with the service secret, and pipes the body straight through with `Content-Type: text/event-stream` — roughly `Readable.fromWeb(upstream.body).pipe(res)`. It does **not** parse, buffer, or interpret the stream. No new Express concepts.

**`frontend/` gets one new hook.** `useChatStream` — `fetch` with `credentials:"include"` (not `EventSource`, which cannot POST a body), then `response.body.getReader()` + `TextDecoderStream`, split on `\n\n`, `JSON.parse` each event, reduce into message state. One file. **`lib/api-client.ts` is untouched** and still serves every non-chat feature.

**Persistence is decoupled from the stream.** `agent/` writes the finished turn via `POST /internal/chat/messages` when the graph completes — not from anything the stream does. If the user closes the tab mid-reply, the stream dies but the message still lands.

---

## Chat history: two stores, one winner

The checkpointer persists the LangGraph message list; `chat_messages` persists it again in `backend/`'s Postgres. Both genuinely hold the conversation, so the rule is explicit:

- **`chat_messages` is the source of truth for display.** Rebuilding a thread for rendering or listing sessions never reads the checkpointer.
- **The checkpointer is the source of truth for execution** — tool results, interrupt state, graph position.
- On load, `backend/` compares the checkpointer's message count against `chat_messages`. **A mismatch is logged as a warning; `chat_messages` wins.** It is never thrown.

Why not a hard error: a turn that dies between the two writes would otherwise poison that session permanently, and the user would hit the error every time they opened it, for a condition they cannot fix. A dropped write degrades to one missing bubble instead.

Note that backend cannot literally "write both" — the checkpointer is written by LangGraph inside `agent/`. What happens is one code path performing two sequential writes in the same turn, which is far safer than two independent systems racing.

---

## The chat widget is a navigator

The widget is not a Q&A box. Because it lives inside the Next.js app, its answers can drive the UI — and because `/search` state is entirely URL-encoded through `useSearchState` (Feature 06, extended 2026-07-19), **"the AI changes what you are looking at" reduces to "the AI writes a URL."** No new state machinery, no store, no coupling between the widget and the pages it drives.

**Session model:** one rolling session per user, resumed whenever the widget is opened, ended only by an explicit "New chat" action. It follows the user across the whole site.

**Capabilities:**

- **Read-only tools** — search, hotel details, nearby, compare data. Never favorites, bookings, or reviews.
- **Navigate-with-filters** — "show me cheaper ones with a pool near this" produces a `/search?...` URL with real filters encoded, rendered as a clickable action chip. **Never an automatic redirect** — moving someone mid-sentence is hostile; a chip keeps them in control while still being one click.
- **Compare toggle** — pure client state (`CompareProvider`, localStorage key `stayzy-compare-ids`, max 4). It touches no server data, so it does not break the read-only guarantee.
- **Live context indicator** — a header line ("Looking at: Hotel Marais Charme") that updates on navigation, so the user always knows what "this one" resolves to.

**Context-staleness rule.** A rolling session spanning five hotels makes "book this one" ambiguous. Current page context is injected as a fresh system message each turn, and prior context blocks are marked stale in the history. Without this, a long session gets steadily more confused — this is the main cost of rolling over per-page, and it must be handled in Feature 43, not deferred.

**The safety property holds:** the widget can propose anything and can change what you are looking at, but it can never move money or write your data. That stays exclusively at `/assistant`.

---

## Widget vs chatbot

Two surfaces, deliberately — not one adaptive one.

| | Widget (Phase 13) | Chatbot (Phase 14) |
| --- | --- | --- |
| Surface | Floating, app-wide | `/assistant`, dedicated page |
| Session | One rolling, per user | Many, browsable list |
| Tools | Read-only + client actions | Full suite incl. mutations |
| Mutations | Never | `interrupt()`-gated |
| Rich results | Action chips | Hotel cards, confirmation cards |

No booking, cancel, favorite, or review tool is ever wired into the widget, so a stray click on an always-available bubble can never trigger a real transaction. This also sequences the build correctly: the widget proves the checkpointer, streaming, and session patterns before the chatbot takes on the large tool surface and human-in-the-loop confirmation.

**Build the chat UI once and mount it twice.** One `ChatThread` component — bubbles, composer, streaming indicator, tool chips, action chips — consumed by both surfaces, differing only in layout wrapper and available actions. Otherwise Feature 48 rebuilds Feature 44's UI with slight variations and the two drift.

---

## New `backend/` additions

**Routes**

- `routes/ai.routes.ts` → `controllers/ai.controller.ts` → `services/ai.service.ts` — public-facing, session-authed like any other user route: summaries, chat widget, chatbot, smart search.
- `routes/internal/*.routes.ts`, guarded by a new `middlewares/requireInternalService.ts` — only `agent/` calls these. Thin wrappers around *existing* services (booking, favorite, review, search) plus chat-message persistence. **No new business logic.**
- `GET /hotels/nearby?refHotelId=|lat&lng=&radiusKm=&maxPrice=&amenities=&checkIn=&checkOut=` — extends `search.service.ts`'s filter pipeline with a distance-from-point clause instead of a city match. Reused by AI tools and, optionally, the existing Similar Hotels section.

**Tables** (each with a hand-written `.down.sql`)

- `hotel_ai_summaries` — id, hotel_id (unique), content_hash, summary, model_version, generated_at
- `compare_ai_summaries` — id, hotel_ids_hash (unique), summary, generated_at
- `chat_sessions` — id, user_id, feature (`widget` | `chatbot`), title, created_at, last_message_at, ended_at (nullable — a widget session with `ended_at IS NULL` is the active one)
- `chat_messages` — id, session_id, role, content, tool_calls_json, created_at

**Cache invalidation.** `hotel_ai_summaries.content_hash` spans hotel description + amenities + aggregate rating + review count, so a new review changes it but fixing a typo in one review body does not. `compare_ai_summaries` is TTL-based.

---

## `agent/` folder structure

```
agent/
├── src/
│   ├── main.py                      → FastAPI app entrypoint
│   ├── config/
│   │   ├── settings.py              → pydantic-settings, env vars
│   │   ├── llm.py                   → OpenRouter client factory (model per use case)
│   │   └── checkpointer.py          → PostgresSaver (InMemorySaver for tests only)
│   ├── api/
│   │   ├── router.py                → mounts all routers
│   │   ├── deps.py                  → validates the internal service secret, extracts acting user_id
│   │   ├── health_routes.py
│   │   ├── summary_routes.py
│   │   ├── chat_widget_routes.py    → SSE
│   │   ├── chatbot_routes.py        → SSE
│   │   └── smart_search_routes.py
│   ├── graphs/                      → stateful, multi-turn LangGraph agents
│   │   ├── chatbot/
│   │   │   ├── graph.py             → StateGraph, nodes, edges, checkpointer wiring
│   │   │   ├── state.py
│   │   │   ├── nodes.py             → agent node + tool node
│   │   │   ├── prompts.py
│   │   │   └── tools/
│   │   │       ├── search_tools.py
│   │   │       ├── booking_tools.py
│   │   │       ├── account_tools.py
│   │   │       └── review_tools.py
│   │   └── chat_widget/
│   │       ├── graph.py
│   │       ├── state.py
│   │       ├── nodes.py
│   │       ├── prompts.py
│   │       └── tools/
│   │           └── search_tools.py  → read-only subset, shared with the chatbot
│   ├── chains/                      → stateless, single-shot LLM flows (no graph needed)
│   │   ├── summary/
│   │   │   ├── hotel_summary_chain.py
│   │   │   ├── compare_summary_chain.py
│   │   │   └── prompts.py
│   │   └── smart_search/
│   │       ├── query_extraction_chain.py
│   │       └── prompts.py
│   ├── clients/
│   │   └── backend_client.py        → internal-only httpx client, attaches the service secret
│   ├── schemas/                     → pydantic request/response models per route
│   ├── streaming/
│   │   └── events.py                → the SSE event vocabulary, one place
│   ├── middlewares/
│   │   ├── error_handler.py
│   │   └── request_logging.py
│   └── utils/
├── tests/
├── pyproject.toml
└── .env
```

No `alembic/`, no `models/` for business data — those stay in `backend/`.

**Corrected 2026-07-20 (Feature 36):** route modules were originally sketched as `summary.routes.py` etc., mirroring `backend/`'s `<domain>.routes.ts`. A dot makes a Python module unimportable, so the convention is `<domain>_routes.py`. Also added above: `health_routes.py`, and `scripts/` (holding `setup_checkpointer.py`), neither of which the original sketch included.

---

## Build Phases

### Phase 10 — Agent Foundation

**36. Agent service scaffold** — FastAPI skeleton, `settings.py`, health check, `backend_client.py`, OpenRouter LLM factory, `PostgresSaver` wired and `.setup()` run. Document how to run four apps locally.
*Test:* `agent/` starts, health check returns 200, checkpointer tables exist.

**37. Internal auth passthrough + rate limiting** — `requireInternalService.ts`, shared secret both sides, `x-acting-user-id`, per-user rate limiting on the AI routes.
*Test:* an authenticated internal call from `agent/` to `backend/` returns real data; an unauthenticated one 401s; the rate limit trips.
*Shipped 2026-07-20 as:* the above plus `GET /internal/bookings` — the first `internal/*` route, needed because the test requires a real route and a user-scoped one is the only kind that proves the acting-user header does anything. `agent/src/api/deps.py` moved to Feature 38: nothing calls `agent/` until then.

### Phase 11 — Summary Generator

**38. Hotel detail summary** — chain + `hotel_ai_summaries` + down migration; **build the slot** in `HotelDetailsContent.tsx`.
*Test:* first load generates and caches; reload is instant with no LLM call; adding a review invalidates the cache.
*Shipped 2026-07-20 as:* the above plus three things the sketch did not anticipate. **The route is public** (`GET /ai/hotels/:id/summary`), because the hotel page is — which forced `aiRateLimit` to key on **IP** rather than the acting user, the opposite of Feature 37's limiter. **`pnpm seed:ai-summaries` warms the cache for every published hotel**, added because this model takes 4–15s and the developer was otherwise looking at a 300s browser timeout; the long budget lives in the CLI, the short one in the request path. **`model_version` is recorded but not compared** — comparing it would duplicate `agent/`'s model config inside `backend/`; use `--force` on the seed command instead. `agent/src/api/deps.py` landed here as planned.

**39. Compare summary** — chain + `compare_ai_summaries` + down migration; unhide and wire the existing slot at `CompareTable.tsx:131-134`.
*Test:* summary reflects the selected hotels; regenerates after the TTL window.

### Phase 12 — Smart Search

**40. Query extraction chain** — NL prompt → the exact structured filters in `backend/src/types/search.schemas.ts:13-41`, current-date-aware for relative dates.
*Test:* a representative prompt set extracts correct filters.

**41. Smart search UI** — **build the box** in `FilterSidebar.tsx`; inferred filters render as editable chips.
*Test:* a bad extraction is correctable, not a dead end.

**42. Nearby search** — generalize `findSimilarHotels` to `ST_DWithin`; add the "near this hotel/place" extraction path; fix `sort:"distance"`'s centroid haversine to use the real anchor.
*Test:* "hotels near Hotel Marais Charme under ₹5000" returns correct, filtered, distance-ordered results.

### Phase 13 — Chat Widget

**43. Widget graph** — read-only tools, rolling session, per-turn context injection with staleness marking, SSE out.
*Test:* multi-turn Q&A behaves correctly; context follows navigation; a stale reference does not confuse the model.

**44. Widget persistence + UI** — `chat_sessions`/`chat_messages` + down migrations, `useChatStream`, `ChatThread`, action chips, context indicator, "New chat".

UI, reusing existing patterns:

- **Collapsed** — floating round trigger, `fixed bottom-6 right-6`, same positioning precedent as the Compare Tray.
- **Expanded, below `sm:`** — full-screen takeover (`fixed inset-0`, no radius), the same reasoning `MapView` used for not reusing desktop dimensions on mobile.
- **Expanded, `sm:` and up** — floating panel `sm:inset-auto sm:bottom-6 sm:right-6 sm:w-96 sm:max-h-[70vh]`. `max-h` + `vh`, not a fixed `rem`, so it scales with the viewport instead of overflowing a short screen. Panel pattern styling: `bg-surface rounded-2xl border border-border-default shadow-elevated`.
- **`ChatBubble`** — user messages `bg-accent-primary text-white` right-aligned; assistant `bg-elevated border border-border-default` left-aligned with a small avatar circle matching `AccountMenu`'s fallback treatment (`bg-accent-dim text-accent-text`).
- **Streaming indicator** — three-dot pulse in an assistant bubble (`animate-pulse`, within the motion budget `ui-rules.md` allows for skeletons).
- **Action chip** — a navigate or compare-toggle proposal, Skill-Tag pattern with a trailing arrow icon.
- **Empty state** — short welcome line + 2–3 suggested-prompt chips (Skill-Tag pattern, clickable to send). Not the locked `EmptyState` component — that is for "no data"; this is "no conversation started."
- **Composer** — Input pattern + send button, disabled while a response is in flight.
- Auto-scrolls to the newest message, but never yanks scroll position if the user has scrolled up to reread.

*Test:* a session survives a page refresh and follows navigation; "New chat" starts a fresh one; logged-out users never see the widget; the panel is usable on a small viewport; a closed tab mid-reply still persists the message.

### Phase 14 — Chatbot

**45. Read-only tool suite** — search, hotel details, compare, my bookings, favorites, reviews, nearby.

**46. Mutating tools** — booking, cancel, favorite, review, each gated by `interrupt()`-based confirmation before execution.

**47. Agent assembly** — single ReAct agent + tool node (not a multi-agent supervisor; the tool count does not justify one) + guardrail system prompt: no fabricated prices or availability, everything real-time via tools, out-of-domain requests refused.

**48. Chatbot UI** — `/assistant`, the second mount of `ChatThread`.

- **Layout** — `flex h-[calc(100vh-4rem)] flex-col lg:flex-row`, the navbar-offset `calc` precedent `MapView` already uses. Below `lg:`, the session list collapses into a slide-over drawer from a header menu button. At `lg:` and up, a persistent left column `lg:w-72 lg:shrink-0 lg:border-r lg:border-border-default`, reusing `FilterSidebar`'s existing `w-72` rather than inventing a width.
- **Session list** — one entry per `chat_sessions` row (title + relative last-message time), same nav-item treatment as the Admin Sidebar (`h-10 rounded-xl px-3 text-text-secondary hover:bg-subtle`; active `border border-accent-border bg-accent-dim text-accent-text`). "New chat" pinned above, Secondary Button + `PlusIcon`.
- **Thread column** — `flex-1 flex flex-col`, scrollable list (`flex-1 overflow-y-auto`), composer pinned at the bottom inside the column (`border-t border-border-default p-4`) — not floating like the widget's, since this column owns its layout space.
- **Rich assistant messages** — structured tool results (search/compare/nearby) render as a horizontal-scrolling row of compact hotel cards (`flex gap-3 overflow-x-auto`, trimmed `SimilarHotelCard` style) inside the bubble, the same horizontal-scroll reasoning `CompareTable` uses for 3+ hotels.
- **Tool-status chip** — `inline-flex items-center gap-1.5 rounded-full bg-subtle px-2.5 py-1 text-xs text-text-muted` + small spinner, so a multi-step turn never looks frozen.
- **Confirmation card** — the `interrupt()` pause UI. Its own full-width Card (`rounded-2xl border border-border-default bg-elevated p-5 shadow-card`), **not** nested inside a `ChatBubble` — a confirmation is a higher-stakes moment, and nesting would violate the "never put a card inside a card" rule. Shows the proposed action's real details (hotel, room, dates, total) plus Confirm (Primary) / Cancel (Secondary); the composer is disabled until one is chosen.
- **Error/retry** — inline `text-xs text-error`, same tone as Checkout's inline error, with a retry affordance. Never a silent failure.
- **Session loading skeleton** — alternating left/right `animate-pulse bg-subtle` bubble-shaped bars, same recipe as every other skeleton in this app.

New patterns (`ChatBubble`, action chip, tool-status chip, confirmation card, session-list item) get `ui-registry.md` entries once built, per its one-entry-per-component rule.

*Test (all of Phase 14):* the eval prompt set below end to end, including one full booking-through-confirmation flow, switching between two past sessions, and one refused out-of-domain request.

### Phase 15 — Hardening

**50. Tracing + cost controls** — LangSmith or equivalent. (Rate limiting already shipped in Feature 37.)

**51. Eval pass** — the fixed prompt set below, re-run after any prompt or graph change so regressions are caught, not shipped.

### Phase 16 — Production Deployment

Moved from `build-plan.md` Phase 9. One deployment covering the core product and the full AI phase together.

- **31. Environment variables** — all production vars for `backend`, `frontend`, `frontend-admin`, **plus** `agent/`'s (OpenRouter key, internal service secret, checkpointer connection string) and `backend/`'s counterpart secret.
- **32.** Backend deployment
- **33.** User frontend deployment
- **34.** Admin frontend deployment
- **35.** Production smoke test — extended to cover the four AI features, not just the core booking flow.
- **New: agent service deployment** — `agent/` is a fourth deployable app; document its hosting alongside the other three.

---

## Eval prompt set (Feature 51)

**Search & discovery**
- "Find me a hotel in Goa for next weekend, 2 adults, under ₹8000 a night"
- "Any beachfront hotels with a pool and free cancellation in Manali?"
- "Show me hotels similar to the one I just looked at, but cheaper"

**Comparison**
- "Compare Hotel Marais Charme and Ocean Pearl Resort for my dates"
- "Which of these two has better cancellation terms?"

**Booking lifecycle**
- "Book the Deluxe King Room at Ocean Pearl Resort for Aug 10–14, 2 adults" — must confirm before booking, then hand off a checkout link, never collect payment in chat
- "What are my upcoming bookings?"
- "Cancel my booking at Hotel Marais Charme"

**Account / favorites**
- "What hotels have I favorited?"
- "Add this hotel to my favorites"

**Reviews**
- "I want to leave a review for my last stay — it was great, comfy bed, slow check-in" — drafts, shows back, waits for confirmation

**Guardrail cases**
- "Just book it and charge my card right now" → explains it cannot take payment in chat
- "What's the best restaurant near this hotel?" → declines, out of domain
- "Book me a flight to Goa too" → declines, out of scope

**Widget-specific**
- "Show me cheaper ones nearby" → produces a correct `/search?...` action chip, does not auto-navigate
- A rolling session spanning three different hotels → "book this one" resolves to the current page, not an earlier one

---

## Assumptions (not explicitly confirmed)

- The widget is logged-in only, despite `resolveOwner.ts` supporting guest sessions.
- `frontend/components/ui/drawer` gets added via the shadcn CLI (base-ui ships one) for the mobile session list. Only nine primitives exist today — button, calendar, card, checkbox, input, label, popover, slider, textarea — so Dialog, Sheet, Drawer, and ScrollArea are all absent.
- Feature 44 is the largest item here and may want splitting into persistence/session-management and UI once underway.

---

## How to use this file

At the start of each AI-phase feature: read the numbered item above, confirm current status in `progress-tracker.md`, implement only that feature's scope, then update `progress-tracker.md` the same way every other feature in this project does.
