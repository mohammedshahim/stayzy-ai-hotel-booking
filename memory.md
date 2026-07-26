# Memory — Feature 48 Chatbot UI, complete, verified, pushed. Phase 14 done.

Last updated: 2026-07-25

## What was built

**Feature 48 Chatbot UI — `/assistant`, shipped and pushed to `origin/main` at `894fee0`.** Four commits, split for traceability:

- `43518ae` `feat(backend)` — `GET /ai/chat/assistant/sessions`, `GET .../sessions/:id`, `POST .../session/end`. No migration; `chat_sessions` already had the index.
- `b487113` `feat(agent)` — the tools restructure plus four model-facing fixes.
- `3c954ff` `feat(frontend)` — the page itself.
- `894fee0` `docs(context)` — Feature 48 logged, two rules corrected.

New frontend: `features/chat/components/{AssistantShell,SessionList,ConfirmationCard,ChatCheckoutButton}.tsx`, `features/chat/hooks/useAssistantStream.ts`, `features/chat/lib/sse.ts`, `app/assistant/page.tsx`. New deps: `remark-gfm`; `@base-ui/react` used directly for the first time (already installed).

New agent: `graphs/{outcome,describe}.py`, `graphs/chat_widget/tools/{search,propose}_tools.py`, `graphs/chatbot/tools/propose_tools.py`. **`agent/src/tools/` deleted.**

`/imprint` was run — `ui-registry.md` has the Chatbot Page entry (68 entries now).

## Decisions made

- **`ended_at` means two different things.** Widget: "conversation over." Chatbot: **"not the thread you land on"** — every session a user owns stays writable forever. Chosen because it needed *no code*: nothing on the write path checks it, and an explicit `sessionId` skips `resolveActiveSession` so the partial unique index is never touched.
- **No tool is shared between surfaces.** `src/tools/` is gone; each graph owns a full copy, including near-identical `SearchHotels`/`GetHotelDetails`. **This reverses Feature 45** at the developer's instruction. Reason that matters: *a tool's docstring is that surface's prompt* — proven twice this session. Only non-tools stay shared (`graphs/outcome.py`, `graphs/describe.py`).
- **Only `ProposeHotel` is bound to the chatbot**, not all three chip tools. See the tool-ceiling finding below.
- **A chips-only turn ends the graph** rather than returning to the model (`is_final_chip_reply`, conditional edge off `tools`, no `drop` for that case).
- **A second hook (`useAssistantStream`), not a mode flag** on `useChatStream`. Only `parseFrames` was extracted.
- **The base-ui Drawer lives in the feature, not `components/ui/`** — one consumer, so no wrapper. Promote if a second surface needs it.
- **Committed straight to `main`**, matching every prior feature in this repo.

## Problems solved

- **"as it appeared earlier" made tools invisible.** Every hotel-name schema said the name must have appeared earlier, but the chatbot resolves cold by searching. The model read the constraint and answered *"I don't have a tool to save hotels to favorites"* — reproducible 2/2, **not flakiness**. Rewording six schemas: favourites 0/2 → 2/3, navigation 0/1 → 3/3.
- **This model handles 12 tools, not 14.** Measured on identical prompts: 14 tools → `AddFavorite` called **0/4**; 12 tools → **4/4**. Binding `ProposeSearch`/`ProposeCompare` hid both favourites tools. **Anything added to the chatbot must be re-tested against favourites first.**
- **`drop` was destroying good answers and the saved history with them.** Its docstring assumed the model would rewrite the text; the prompt forbade repeating. A full answer written alongside chip calls was retracted from screen, stayed in model history, and only the filler that followed reached `chat_messages`. Fixed both graphs.
- **`MAX_TOOL_LOOPS` unbinding tools is what makes a model type a tool call out as text** — raw `<tool_call>` XML, or `[View X](ProposeHotel:X)` markdown. Verified 4/4 unbound vs 0/4 bound. **The fix (a just-in-time system message at unbind, 0/4 leaks) was reverted** with the model switch. The ceiling can still bite on nemotron.
- **Models send the string `"null"` for optional fields**, which reaches `backend/` as a literal and 400s a search. **The guard was reverted** with the model switch.
- **Markdown tables need `remark-gfm`** — commonmark rendered pipe syntax as literal text.
- **The model never knew the date** and answered from its training cutoff (~a year off). `TODAY` is now formatted from the clock each turn.
- Also fixed: stale booking status answered from memory; recommending Booking.com/Expedia on a booking product; asking users for booking ids it must never see.

## Current state

- **Phase 14 complete.** Working tree clean, `origin/main` = local, all checks green (`pnpm build` backend, `tsc --noEmit` + `eslint` frontend, `ruff check`/`format` + graph compile agent).
- **Model is back on `nvidia/nemotron-3-ultra-550b-a55b:free`** (both slots). The ling-3.0-flash experiment was reverted in full.
- Verified live throughout with throwaway users: book → pause → decline → re-ask → confirm → `pending_payment` + checkout link; favourites; saved list; navigation chip; session switching; New chat; reload mid-pause; unverified redirect; 404 on another user's session. Widget re-verified after every shared change. **The dev account's single completed unreviewed booking is still intact** — keep using throwaway users.

## Next session starts with

**Feature 50 — Tracing + cost controls** (Phase 15; LangSmith or equivalent). Feature 49 is retired. Read `ai-phase-plan.md`. Then Feature 51 (evals), then Phase 16 (deployment, Features 31–35).

## Open questions

- **Test data still not cleared — asked five times now.** "Temp User 1" holds **18 bookings**, and `agent.checkpoints` now holds **48 threads**. `ListMyBookings` reads them verbatim into any Feature 51 eval. A `test room test` hotel is also in search results.
- **Two reverted fixes worth reconsidering**, both model-independent: the just-in-time notice when `MAX_TOOL_LOOPS` unbinds tools, and the `"null"`-argument guard. Also **`chat_widget_routes.py` has no empty-turn guard** — a turn producing no text emits no `error` frame; the chatbot route has one.
- **`useAssistantStream` is 334 lines** against a 167-line next-largest hook, with 13 state slots. The split (a `useAssistantSessions` hook beside it) was discussed and **not done**. Three specific defects noted: a `return` inside `finally`, `runTurn`'s `finally` doing four unrelated jobs, and three overlapping booleans.
- Minor `ui-registry.md` inconsistencies recorded but not fixed: `ChatComposer` is `p-3` in the widget and `p-4` on the page; the retry affordance uses `border-error/40` where every other error surface uses the flat `error`/`error-dim` tokens.
- Should `seed.ts` call `recalculateHotelRatingStats` after inserting reviews? The aggregate logic itself is proven fine — this is only a missing call after seeding.
- The Feature 16 rating-scale inconsistency is still open (1–5 stored, 0–10 displayed). Features 45–48 all sidestepped it.
- Standing: `trust proxy` must be settled at deployment or the IP-keyed `aiRateLimit` is disabled in production (Phase 16).
