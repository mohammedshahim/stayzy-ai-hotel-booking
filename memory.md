# Memory — Feature 47 Agent assembly, complete, verified, committed

Last updated: 2026-07-25

## What was built

**Feature 47 Agent assembly — complete, verified end to end, and committed.** It reaches further than `ai-phase-plan.md`'s one-line description: the graph, the `agent/` route, *and* the `backend/` route. No UI — Feature 48 is now pure React against a route that already works.

New — agent: `graphs/chatbot/state.py` (`ChatbotState`: messages, `hotel_ids`, `actions`, `steps`), `graphs/chatbot/prompts.py` (`CHATBOT_SYSTEM`), `graphs/chatbot/nodes.py` (`call_model`, `call_tools`, `should_continue`, `_find_hotel`, `_run_compare`, `_run_one`), `graphs/chatbot/graph.py` (`agent ⇄ tools`, no context node), `api/chatbot_routes.py` (`POST /chat/assistant`, `GET /chat/assistant/pending`), `api/chat_replies.py` (`save_reply`), `tools/resolve.py` (`resolve_hotel`).

Modified — agent: `streaming/events.py` (+`confirm` frame), `schemas/chat.py` (+`ChatbotRequest`, `ConfirmDecision`, `ConfirmLine`, `PendingConfirmation`, `PendingData`), `api/router.py`, `graphs/chat_widget/nodes.py` (imports shared `resolve_hotel`), `api/chat_widget_routes.py` (imports shared `save_reply`).

Modified — backend: `routes/ai.routes.ts` (+`POST /ai/chat/assistant`, `GET /ai/chat/assistant/pending`), `controllers/ai.controller.ts` (+`streamAssistantChat`, `getAssistantPending`), `services/ai.service.ts` (+`getFromAgent`, `streamFromAgent` now returns `AgentStreamResult`), `services/chat-session.service.ts` (+`startChatbotSession`, `findChatbotSessionId`, `ownsSession`; `resolveActiveSession` takes a `ChatFeature`), `types/chat.schemas.ts` (+`chatbotBodySchema`, `chatbotPendingQuerySchema`, +`checkout` action variant).

Modified — context: `progress-tracker.md`, `ai-phase-plan.md`, `architecture.md`, `library-docs.md`, `code-standards.md`.

## Decisions made

All eight were agreed with the developer up front via `/architect`:

- **47 ships end-to-end minus UI**, so the `emailVerified` obligation is discharged in the feature that created the exposure.
- **A hand-rolled `StateGraph`, not `create_react_agent`** — the prebuilt node gives no control over the one-mutation rule or the unbind-tools ceiling.
- **One route takes `message` XOR `decision`.** A decision resumes with `Command(resume={"approved": bool})` and is never recorded as a chat message. Rejected a separate `/confirm` route as duplicating session resolve + 502 handling + pipe for an identical response.
- **The tool node runs every read in model order, then at most one mutating call**; a second mutation in the batch gets a "not run, ask again" ToolMessage. **Every call still gets a ToolMessage** or the next model call is invalid under the OpenAI protocol.
- **`sessionId` optional and ownership-checked** (404 otherwise), so Feature 48's session list needs no contract change. `chat_sessions.id` is still the `thread_id` verbatim.
- **A message on a paused thread is refused with 409, not auto-declined** — and not recorded.
- **`GET /ai/chat/assistant/pending`** exists so a reload re-renders the card instead of stranding the thread.
- **An unseen hotel name resolves by searching, accepting only an exact case-insensitive name match.** Developer chose cold resolution over refusing; exact matching is what makes it safe.

Two things were **reverted on the developer's instruction**: a retry for empty model turns (the free OpenRouter model's flakiness is not something this feature should engineer around). `MAX_TOKENS = 2000` and the `error` frame for an empty turn were kept — the first because this surface writes hotel lists, the second because a turn must never end in silence.

## Problems solved

- **Four LangGraph 1.2.9 behaviours verified against the installed package, two of which dictated the design.** (1) Plain input on a paused thread **appends the message, re-runs the node and pauses again with a new interrupt id** — it does *not* resume and does *not* count as a refusal, so the assumed "typing declines it" fail-safe was wrong; hence the 409. (2) `Command(resume=..., update=...)` works but puts the injected message **between** the assistant's tool_call and its ToolMessage, which strict OpenAI-protocol providers reject — so auto-declining is off the table. (3) A duplicate resume with nothing pending is a **no-op**, so a double-clicked Confirm cannot book twice. (4) `StateSnapshot.interrupts` is how a pause is read back; **interrupt ids regenerate on each re-pause**, so never key on them.
- **`chatActionSchema` had no `checkout` variant** — a latent Feature 46 bug. The first assistant reply carrying a payment link would have been rejected by `POST /internal/chat/messages` and silently lost. Nothing had ever sent one through that path before.
- **`destination` never matches a hotel name** (`search.queries.ts` matches city / country / "City, Country" only), so cold resolution goes through `near=`, which `resolveSearchAnchor` resolves via `findHotelLocationByName`. **That lookup is a substring `ilike`**, so the exact-match test is applied to the returned *result* names, not to the anchor — otherwise "the Ritz" would resolve to a neighbouring hotel. Verified: it refuses and lists what the search did return.
- **The model omits required tool args.** It called `BookRoom` without `room_type_name`, which would have crashed the turn on a direct `args[...]` index. A `KeyError` guard in the tool node returns a recoverable message instead; the model retried correctly and paused. Confirmed in the wild, not hypothetically.
- **Empty model turns are transient, not a context limit.** Two consecutive cancel turns returned no text and no tool call; replaying the identical history worked (5237 input tokens). Diagnosed before acting rather than assuming overflow.
- **A better verification harness than Feature 46 used:** a throwaway signed-in user created via the sign-up API, `emailVerified` flipped by SQL, and booking statuses flipped by SQL to reach cancellable/completed states. **The dev account's single completed unreviewed booking was never touched and is still intact** — Features 48 and 51 should do the same.
- **Doc audit (developer-prompted) found four real issues, all fixed:** a dangling cross-reference (Feature 46's entry pointed at a Current Status block that had been replaced), nested sub-bullets introduced into `library-docs.md` where zero existed, an overstatement ("the only way" to re-render a pause), and an imprecise thread count. Verified the other three pointers into Current Status still resolve.

## Current state

- **Everything works, verified through `backend/` with a real signed-in user, not a harness.** Out-of-domain refused with no tool call; search / room types / compare / reviews reading real inventory; full book → pause → decline (nothing written) → re-ask → pause → approve → committed `pending_payment` row with previewed total USD 435 matching the committed total; cancel and review each paused and committed, confirmed by direct SQL; `403 email_not_verified` on both a message and a decision turn; `409` on a message sent mid-pause with nothing recorded; the pending route returning the full envelope; and a fabricated two-mutation batch proving both reads ran, the first mutation paused, and the second was refused.
- **11 tools bound**, correct set. **Zero uuids across 63 model-visible messages**, regex-checked; the only uuid is inside `action.path`.
- **The widget was re-run after both extractions and is unchanged** — search, chips with resolved ids, `drop`, and reply persistence all still work.
- **All verification data restored in one transaction.** Throwaway user and its bookings / favourite / review / sessions / messages deleted; `Hotel Marais Charme` back to `review_count`/`average_rating` `0|0` with its 6 seeded reviews intact; all four of 47's checkpointer threads cleared.
- Checks clean: `ruff check` + `ruff format --check` (agent), `pnpm build` (backend).
- **Committed in four parts and pushed** — `feat(backend)`, `feat(agent)`, `docs(context)`, `chore` for this file.

## Next session starts with

**Feature 48 — Chatbot UI** (`/assistant`, the second mount of `ChatThread`). What it inherits is written up in `progress-tracker.md`'s Current Status as a numbered list: the fixed SSE vocabulary (`token`, `drop`, `tool_start`, `tool_end`, `action`, `confirm`, `error`, `done`), the fact that a `BookRoom` pause emits `tool_start` with **no matching `tool_end`** so a tool chip must not wait for one, that the composer must be disabled while a pause is pending, the pending route for reload recovery, and the `checkout` action being a relative path.
Two things to settle early in 48: **what "New chat" means** — the unique index still allows only one active session per `(user, feature)`, so a second live chatbot thread needs the current one ended first, and there is no `endChatbotSession` yet — and that **`/imprint` is due after 48**, since it is the first chatbot UI and `ui-registry.md` needs `ChatBubble`, the tool-status chip, the confirmation card and the session-list item.

## Open questions

- **Shipped as-is, but never explicitly approved:** the `code-standards.md` clause permitting a non-router module in `agent/src/api/`, naming `api/chat_replies.py`. It was raised as a blocking question and the developer answered by saying "commit", so it went in. The clause exists because `api/` already imports `clients/` directly (`chat_widget_routes.py` does it today), so the file breaks no layering — but without it the next reader sees a violation of "FastAPI routers... only". **If it should come out, the revert is that one clause plus giving each chat route its own `_save_reply` back** — at the cost of two copies of the persistence contract, the same drift the developer voted against for `resolve_hotel`.
- **The free OpenRouter model returns an empty turn occasionally** — no text, no tool call. Accepted as a model limitation, deliberately not worked around. The `error` frame means the user sees a failure rather than silence.
- **Test-data deletion is still unauthorized** — asked four times now. "Temp User 1" holds 18 bookings; `agent.checkpoints` holds 23 leftover threads (15 named probes from Features 43–45, 8 real widget session threads); a `test room test` hotel is also visible in search results. `ListMyBookings` and `SearchHotels` surface all of it verbatim into Feature 51's evals.
- **Should `seed.ts` call `recalculateHotelRatingStats` after inserting reviews?** This session proved the aggregate logic itself is fine: publishing one review recalculated Marais Charme to `7 / 4.43`, correctly counting all six seeded reviews plus the new one. So it is purely a missing call after seeding.
- **The Feature 16 rating-scale inconsistency is still open** (1–5 stored, 0–10 displayed). Features 45, 46 and 47 all sidestep it.
- Three Minor Pyright-only findings from Feature 46 remain deliberately unfixed; `agent/` has no type checker configured and ruff is the gate.
- Standing item: `trust proxy` must be settled at deployment or the IP-keyed `aiRateLimit` is disabled in production (Phase 16).
