# agent/

The Stayzy AI agent service — Python, FastAPI + LangGraph. Built from Feature 36.

**Neither frontend ever calls this service.** Every AI feature is reached as a
`backend/` route that calls in here with a shared internal secret, which keeps
the standing invariant intact: `backend/` is the only service any other app
talks to.

`agent/` owns no product data. Hotels, bookings, chat history — all of it stays
in `backend/`'s Postgres via Drizzle. The one piece of state this service owns
is the LangGraph checkpointer.

## Setup

Requires Python 3.12+ and [uv](https://docs.astral.sh/uv/). `uv` downloads a
matching interpreter itself, so no system Python version work is needed.

```bash
cd agent
cp .env.example .env          # then fill in the values
uv sync                       # create .venv and install
uv run setup-checkpointer     # create the checkpointer schema + tables
uv run python -m src.main     # start on :4100
```

`uv sync` is slow on a first run — it downloads an interpreter plus ~60
packages.

## Commands

```bash
uv run python -m src.main     # dev server on :4100, reloads on src/ changes
uv run setup-checkpointer     # create/upgrade checkpointer schema (idempotent)
uv run ruff check src/        # lint
uv run ruff format src/       # format
```

There is no test suite, matching the rest of this repo — features are verified
by running the real app against the real seeded database.

## Running all four apps locally

Each app runs from its own directory; there is no root-level task runner. Start
Postgres first, then:

| App | Directory | Command | Port |
| --- | --- | --- | --- |
| Backend | `backend/` | `pnpm dev` | 4000 |
| User frontend | `frontend/` | `pnpm dev` | 3000 |
| Admin frontend | `frontend-admin/` | `pnpm dev` | 5173 |
| Agent | `agent/` | `uv run python -m src.main` | 4100 |

Only `backend/` is a hard dependency of `agent/`. Drive `frontend/` at
`localhost`, never `127.0.0.1` — see the root `CLAUDE.md`.

## The checkpointer

LangGraph's checkpointer persists graph **execution** state — tool results,
interrupt state, graph position — keyed by `thread_id` (always
`chat_sessions.id`). Nothing outside a graph reads it; `chat_messages` in
`backend/`'s Postgres is the source of truth for display.

Three things about it are deliberate:

**`PostgresSaver` in every environment, including local dev.** `InMemorySaver`
is for tests only. A paused `interrupt()` survives a process restart in
production and does not in memory, and building human-in-the-loop flows against
the wrong behaviour would hide that until the hardest feature was already done.

**Its schema is created by an explicit command, never on boot.** `uv run
setup-checkpointer` is the counterpart to `backend/`'s `pnpm migrate`. Running
DDL at startup would mean the service needs schema-creation privileges in
production forever, and a crash loop would become a DDL loop. The command is
idempotent — the library tracks its own migrations in `checkpoint_migrations`
and applies only what is missing, so re-run it after upgrading
`langgraph-checkpoint-postgres`.

**Its tables live in their own schema.** The library creates `checkpoints`,
`checkpoint_blobs`, `checkpoint_writes`, and `checkpoint_migrations`
*unqualified*, so left alone they would land in `public` alongside Drizzle's
product tables. Every connection pins `search_path` to `CHECKPOINTER_SCHEMA`
(default `agent`) via a libpq `options` parameter, so the two never share a
namespace. This is not an Alembic migration and must never become one.

## Layering

```
api/ (routes) → graphs/ or chains/ → clients/ → backend/
```

- `api/` — FastAPI routers. Request/response shaping and DI only
- `chains/` — stateless single-shot LLM flows. No graph, no checkpointer
- `graphs/` — stateful multi-turn LangGraph agents
- `clients/` — the only place outbound HTTP happens. A tool never calls `httpx` directly
- `schemas/` — pydantic request/response models

Full conventions live in `context/code-standards.md`; library rules in
`context/library-docs.md`.

## Environment

See `.env.example` for the full list. `.env` is gitignored; `.env.example` is
tracked and is the template a fresh clone copies from.

Note that `AGENT_DATABASE_URL` and `BACKEND_INTERNAL_URL` are **required with no
default**. This is deliberate and differs from `backend/src/config/env.ts`,
which defaults its URLs to localhost — an unset production value there boots
fine and then fails silently. Here a missing value refuses to start and names
itself.
