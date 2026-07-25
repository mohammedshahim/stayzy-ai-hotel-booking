# Memory — Feature 44 Widget persistence + UI, complete and verified, uncommitted

Last updated: 2026-07-25

## What was built

**Feature 44 Widget persistence + UI, complete and verified end-to-end.** The persistence layer plus the entire chat widget UI. Phase 13 (Chat Widget) is now complete.

New — backend: `models/chat.schema.ts` (`chat_sessions`, `chat_messages`), migration `drizzle/0004_add_chat_sessions_and_messages.sql` + hand-written `.down.sql`, `queries/chat.queries.ts`, `services/chat-session.service.ts`, `controllers/internal/chat.controller.ts`, `routes/internal/chat.routes.ts`.
Modified — backend: `config/db.ts` (registered chat schema), `types/chat.schemas.ts` (action + assistant-message schemas), `controllers/ai.controller.ts` (`streamWidgetChat` resolves-or-creates session + `getWidgetSession`/`endWidgetChat`), `routes/ai.routes.ts` (widget session GET + end routes), `routes/index.ts` (mounted `/internal/chat`).
Modified — agent: `api/chat_widget_routes.py` (saves the assistant reply at turn end via `POST /internal/chat/messages`, tracking surviving replies by message id and honouring `drop`).
New — frontend `features/chat/`: `types.ts`, `lib/chat-actions.ts` (`chipToSearchHref`), `hooks/useChatStream.ts`, `hooks/usePageContext.ts`, and components `ChatBubble`, `ChatMarkdown`, `ChatActionChip`, `ChatThread`, `ChatComposer`, `ChatPanel`, `ChatWidget`.
Modified — frontend: `app/layout.tsx` (server-gated `<ChatWidget/>` via `getServerSession`), `app/globals.css` (`.shimmer` utility + keyframes + reduced-motion), and `package.json` (added `react-markdown` 10.1.0).
Modified — context: `progress-tracker.md`, `architecture.md`, `ai-phase-plan.md`, `ui-rules.md`, `ui-registry.md`, `library-docs.md`.

## Decisions made

- **Two stores, split write ownership.** LangGraph checkpointer (agent schema) = model memory; `chat_messages` = separate display read model; backend never reads the checkpointer. Backend writes the **user** message at turn start (only once the stream is confirmed open, so a 502 leaves no unanswerable question). Agent writes the **assistant** reply at turn end — only it knows which reply survived a `drop` and which chips were final.
- **Resolve-or-create the active session per turn; frontend never handles a session id.** One active widget session per `(user, feature)` enforced by a partial unique index `WHERE ended_at IS NULL`; resolver catches the insert conflict and re-reads. `sessionId` is sent to `agent/` as the checkpointer `thread_id` verbatim — `widget:{userId}` became a real row id with zero Python change.
- **Widget + chatbot histories share the tables, separated by a `feature` text column** (`'widget'|'chatbot'`) — one WHERE clause, not two table sets. Confirmed as the MVP-with-scalability shape.
- **Column is `actions_json` (jsonb), not the plan's `tool_calls_json`.** Holds only the *final* action chips (`navigate`/`open_hotel`/`compare` with resolved ids or filter names), never progress chips. `architecture.md` corrected; `ai-phase-plan.md` keeps `tool_calls_json` as plan-of-record.
- **Cancel-on-disconnect.** Closing the tab mid-reply cancels the turn (`req.on("close")` → `upstream.abort()`), so only the user's message persists. `ai-phase-plan.md`'s closed-tab test wording was corrected to say so.
- **Widget sits level with the Compare Tray**, not lifted above it. Trigger + open panel both `sm:bottom-6`; only the mobile trigger keeps `bottom-32` (tray is full-width below `sm:`). The `sm:bottom-24` lift was removed and the now-unused `isTrayShowing` prop dropped from `ChatPanel`.
- **Assistant replies render markdown via a shared `ChatMarkdown`** (react-markdown, commonmark only, tokens-mapped) — the same component Feature 48's chatbot will mount. User bubbles stay plain.
- **`.shimmer` "Thinking…" indicator** replaces the three-dot pulse — first motion primitive beyond `animate-pulse`/`animate-spin`, honours `prefers-reduced-motion`.

## Problems solved

- **`react-markdown` needed because the qwen model emits `**bold**`/lists on its own** — a raw string showed literal markers. Assistant-only; user bubbles keep `whitespace-pre-wrap`. The assistant bubble drops `whitespace-pre-wrap` (markdown owns paragraph spacing) or replies double-space.
- **Don't hand-roll `scroll-fade`/`scrollbar-none`** — `shadcn/tailwind.css` (imported in globals.css) already ships them as `@utility` (dynamic edge fade driven by scroll position). A custom version was written and then removed. Rule: check `shadcn/tailwind.css` before writing a custom utility.
- **A "reply didn't persist" scare during verification was a test bug, not a product bug.** A Playwright `waitForReply` returned mid-stream (the streaming bubble carries no `animate-pulse` to poll) and its immediate `page.reload()` aborted the turn before the save — i.e. it exercised cancel-on-disconnect. The corrected test waits for the SSE POST's `requestfinished` (true stream end) and persists every time. Only one `POST /ai/chat/widget` fires per send — no double-submit.
- **The qwen loop cap now has a live run** (it terminated cleanly ~10s), closing Feature 43's open item. qwen loops where the old Nemotron did not, which is why the graph caps its tool loop.
- **Scratch DB check scripts must live inside `backend/`** to resolve the relative `./src/config/db` import (run `npx tsx __x.ts` from `backend/`, then delete). A `/tmp` script can't resolve the modules.

## Current state

- **Everything works and is verified** against the real running stack (backend :4000, agent :4100, frontend :3000) and the seeded DB, in a real headless browser: logged-out shows no widget; empty state + context indicator that follows navigation; one live turn = single request + correct reply + chips; persistence across cold reload; `open_hotel` chip → `/hotels/{id}`; `navigate` chip → `/search?destination=Paris&amenities={uuid}` (amenity **name** resolved to catalog uuid client-side — Feature 40 no-uuid invariant); New chat clears and stays cleared; mid-stream disconnect persists only the user message; markdown renders `<strong>` with no literal `**`; `.shimmer` shows during streaming; `scroll-fade` `--scroll-fade-t` grows `0px → min(12%, 40px)` on scroll; widget level with tray, no overlap; zero console errors.
- Checks clean: `pnpm build` + `tsc --noEmit` + `pnpm lint` (frontend), `pnpm build` (backend), `ruff` (agent).
- **All context files audited and updated.** progress-tracker.md (Phase 13 complete, next up 45, full Feature 44 Completed entry), architecture.md (tables + `actions_json`), ui-rules.md (shimmer motion), ui-registry.md (Chat Widget entry), library-docs.md (react-markdown), ai-phase-plan.md (closed-tab test wording). build-plan.md / code-standards.md / ui-tokens.md needed nothing.
- **NOT committed.** Working tree holds all Feature 44 changes plus the doc updates.
- Dev servers currently running (backend :4000, agent :4100, frontend :3000).

## Next session starts with

1. **Get the developer's go-ahead, then commit in four parts** per one-commit-per-concern: `feat(backend)`, `feat(agent)`, `feat(frontend)`, `docs(context)`. (Committing was not yet authorized.)
2. **Clean up test data** before Feature 45's eval work: a leftover demo thread for the storage-state test user in `chat_sessions`/`chat_messages`, and test users `widget44-*` / `widget44b-*` / `widget-probe@example.com` in the dev `user` table. Also the older "Temp User 1" bookings against Hotel Marais Charme (open since Feature 27) — they will pollute any chatbot eval that reads real bookings.
3. **Feature 45 — Read-only tool suite (Phase 14, Chatbot).** Read `ai-phase-plan.md`. Copies `services/search-extraction.service.ts`'s name→id pattern for its tools (no-uuid invariant), inherits `GET /internal/search`, and reuses the shared `ChatThread`/`ChatMarkdown` UI.

## Open questions

- None blocking. Standing item: `trust proxy` must be settled at deployment or the IP-keyed `aiRateLimit` is disabled in production (Phase 16). The Feature 16 rating-consistency question remains open but is mostly moot going forward.
