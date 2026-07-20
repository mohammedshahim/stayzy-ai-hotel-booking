# Memory — Feature 36 Agent Service Scaffold (+ Python simplicity standard)

Last updated: 2026-07-20

## What was built

**Feature 36 — the `agent/` app now exists and runs on :4100.** The fourth app, and the only non-TypeScript one. Python 3.12.11 (downloaded by `uv`; the machine's own Python is 3.13), managed with `uv`.

Files, all under `agent/`:

- `pyproject.toml` — the exact dependency set `code-standards.md` names, plus ruff with `ANN` selected so the full-type-hints rule is enforced by the linter, not by discipline. Includes `dev-mode-dirs = ["."]` (see Problems solved) and a `setup-checkpointer` script entry point
- `src/config/settings.py` — pydantic-settings, one module-level `settings` object
- `src/config/checkpointer.py` — `AsyncPostgresSaver` over an `AsyncConnectionPool`; `open_pool`/`close_pool` called from the app lifespan
- `src/config/llm.py` — OpenRouter via `langchain-openai`; `get_fast_llm()` / `get_smart_llm()`
- `src/clients/backend_client.py` — the single outbound-HTTP chokepoint. Module-level `httpx.AsyncClient` + `get`/`post`/`close`. Attaches `x-internal-secret` and `x-acting-user-id`, unwraps `{success, data?, error?}`, raises `BackendError`
- `src/middlewares/error_handler.py` — same envelope for HTTP, validation, and unhandled errors; generic message on 500
- `src/api/health_routes.py`, `src/api/router.py`, `src/schemas/common.py`, `src/main.py`, `src/scripts/setup_checkpointer.py`
- `README.md`, `.gitignore`, `.env.example` (tracked) and `.env` (gitignored)

421 lines across 10 files, largest 78.

**Context files updated:** `context/code-standards.md` (new Simplicity section + Python naming rule + corrected env table), `context/library-docs.md` (schemas rule relaxed), `context/ai-phase-plan.md` (corrected folder sketch), `context/progress-tracker.md` (Feature 36 entry, status moved to 37), `CLAUDE.md` (agent app row, commands, two new gotchas).

## Decisions made

- **`.setup()` is an explicit command (`uv run setup-checkpointer`), never a boot-time hook.** Counterpart to `pnpm migrate`. Running DDL on every start would require schema-creation privileges in production forever and turn a crash loop into a DDL loop.
- **The checkpointer's four tables live in their own `agent` Postgres schema, not `public`.** The library creates `checkpoints`/`checkpoint_blobs`/`checkpoint_writes`/`checkpoint_migrations` *unqualified*, so left alone they land among Drizzle's 25 product tables. Every connection pins `search_path` via a libpq `options` parameter rather than a session `SET`, so it survives pool reconnects. The setup script creates the schema first — `search_path` cannot resolve to a schema that does not exist.
- **Feature 36 touched `agent/` and docs only — no `backend/` changes.** `AGENT_BASE_URL` / `services/ai.service.ts` were listed against Feature 36 in the env table but nothing calls the agent yet, so they were moved to Feature 38 and the table corrected. Scope is sacred.
- **`AGENT_DATABASE_URL` and `BACKEND_INTERNAL_URL` are required with no default**, deliberately unlike `backend/src/config/env.ts:7-9`. The Feature 31 audit flagged those localhost defaults as a silent production failure; that pattern was not copied into a fourth app. `code-standards.md` now names `agent/` as the pattern for new apps.
- **No tests**, though `pytest` is installed per `code-standards.md`. No app in this repo has a test suite; the standard is verification against the real running app.
- **Simplicity is now a standing rule for all of Features 37–51** (developer's instruction, late in the session). Lives in `code-standards.md` → Agent Conventions → "Simplicity comes first", sits above every other Python rule, and explicitly wins any conflict with them. Feature 36's code was refactored against it the same day: dropped an `@lru_cache` settings factory, a client class + global singleton, an `LlmUseCase` enum, a three-function checkpointer accessor triad, a two-field schema file, and an unused `ErrorResponse` model. No behaviour changed; every verification was re-run and passed identically.
- Two context rules were **relaxed rather than silently broken** to fit that: `code-standards.md` and `library-docs.md` both required pydantic models to live in `schemas/`; a small single-route model may now stay in its route module.

## Problems solved

- **`<domain>.routes.py` is not importable in Python.** A dot makes the module unreachable (`from src.api.health.routes import router` looks for a `health` *package*). `ai-phase-plan.md`'s folder sketch used that form throughout — corrected there, in `code-standards.md`, and in `CLAUDE.md` so Features 38+ do not repeat it. Convention is `<domain>_routes.py`.
- **The editable install produced no path hook**, so `uv run setup-checkpointer` died with `ModuleNotFoundError: No module named 'src'`. Hatchling needs `dev-mode-dirs = ["."]` for this `src`-as-package layout.
- **uvicorn's reloader watched `.venv`**, logging "38 changes detected" and reload-looping on dependency files. Fixed with `reload_dirs=["src"]`.
- **`uv sync` is genuinely slow here** — roughly 96 KB/s, several minutes, with long stretches of no visible output. It looks exactly like a hang and is not one. Documented in `agent/README.md`.
- Installed versions are far newer than model training data (LangGraph **1.2.9**, langchain-core **1.4.9**, langgraph-checkpoint-postgres **3.1.0**, FastAPI **0.139.2**). Per `library-docs.md`'s standing warning, the real installed package source was read before writing any of it. Worth doing again for Features 37+.

## Current state

Feature 36 is complete and verified. **Nothing is committed** — working tree has `agent/` untracked plus modified `CLAUDE.md`, `context/ai-phase-plan.md`, `context/code-standards.md`, `context/progress-tracker.md`.

Verified against the real running app and real database, not by reading code:

- `uv run setup-checkpointer` creates the schema and all four tables; re-running is a clean no-op
- `psql` independently confirms all four tables in schema `agent`, **zero in `public`**, Drizzle's 25 tables untouched
- Service boots, lifespan opens the pool, `GET /health` → `200 {"success":true,...}`; unknown path → `404 {"success":false,"error":"Not Found"}`; no reload churn
- **Checkpoint write/read round-trip through the connection pool** — the load-bearing test, since setup uses `from_conn_string` while runtime uses the pool, so it proves `search_path` pinning holds where it matters
- `backend_client` reached the real backend, unwrapped a real envelope (8 seeded amenities from `GET /amenities`), and raised on a bad route
- Settings with required vars stripped refuses to boot and names all four
- `ruff check` and `ruff format` clean across `src/`
- Verification checkpoint rows deleted afterward; all three `agent.*` tables confirmed back to 0 rows

**Not verified: anything involving OpenRouter.** The LLM factory constructs clients with the right model and base URL, but no call has been made — the API key is still a placeholder. The model slug (see below) is therefore unvalidated against OpenRouter's catalog.

Both dev servers were left running: backend on :4000, agent on :4100.

## Next session starts with

1. **Commit this session's work** — nothing is committed. Suggested split: (a) `agent/` scaffold, (b) the context/docs updates, (c) the simplicity standard + refactor if you want it separable. Note `agent/uv.lock` should be committed; `agent/.env` and `agent/.venv/` are correctly gitignored.
2. Then **Feature 37 — Internal auth passthrough + rate limiting**. Read `ai-phase-plan.md`, not `build-plan.md`. **First step: copy the `INTERNAL_SERVICE_SECRET` value that already exists in `agent/.env` into `backend/.env`** — the two must match. Then `requireInternalService.ts` following the `requireCronSecret.ts` precedent (`crypto.timingSafeEqual`), `x-acting-user-id`, and per-user rate limiting on the AI routes. `agent/`'s half already works — `backend_client.py` sends both headers. There are no `internal/*` routes yet, so Feature 37 builds the first one and is the first chance to test the header pair end to end.

## Open questions

- **A real OpenRouter API key is still not obtained.** `agent/.env` holds a placeholder. Fine through Feature 37 — nothing calls an LLM until **Feature 38**, which is where it becomes hard-blocking.
- **Both model slots are set to `nvidia/nemotron-3-ultra-550b-a55b:free`** (developer's call: "for now later will update"). The slug is unverified against OpenRouter's catalog since no call has been made. The fast/smart split is retained in config so the chatbot's model can be raised without touching a call site.
- **Leftover "Temp User 1" test data in the dev DB** (bookings against Hotel Marais Charme, ~2026-07-13) — flagged since Feature 26, still not deleted, still awaiting a decision. This now matters more: it will pollute any chatbot eval that reads real bookings (Features 45–46, 51). Worth clearing before Feature 45.
- **`agent/`'s `graphs/` and `chains/` directories do not exist yet** — deliberately, since nothing needs them until Feature 38. The `ai-phase-plan.md` sketch shows them.
- The compare-tray `sm:w-fit` change from the prior session remains an interpretation, not a confirmed diagnosis — one class to revert if it looks wrong.
- The Feature 16 rating-consistency question — carried over many sessions, likely mostly moot since Feature 24, never re-verified.
- Whether to retrofit the fetch-error-state pattern onto `HotelsListPage` and other existing admin lists — not blocking, flagged in `ui-registry.md`.
- Hosting provider still undecided; no longer blocking anything since deployment moved to Phase 16.

## Note on secrets

No credential values are recorded in this file. `INTERNAL_SERVICE_SECRET` (generated locally), `OPENROUTER_API_KEY` (placeholder), and the database connection string live only in `agent/.env`, which is gitignored. `agent/.env.example` is the tracked template and contains placeholders only.
