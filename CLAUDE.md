# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Read this first

**`context/` is the source of truth for this project.** Read it before writing any code — never assume, always verify against it.

| File | What it holds |
| --- | --- |
| `context/progress-tracker.md` | **Start here every session.** Current phase, next feature, blocking issues, every decision made so far |
| `context/build-plan.md` | The numbered feature list, Features 01–35 |
| `context/ai-phase-plan.md` | The AI phase, Features 36–51 — authoritative for those features, not `build-plan.md` |
| `context/architecture.md` | Stack, folder structure, data flow, DB schema, and the **invariants** that must never be violated |
| `context/code-standards.md` | Conventions for all four apps. Follow exactly |
| `context/library-docs.md` | Project-specific rules for each third-party library |
| `context/ui-rules.md` / `ui-tokens.md` / `ui-registry.md` | Design system rules, CSS variable tokens, and one entry per built component |

Two standing rules from those files worth repeating here: **scope is sacred** (build only what the current feature requires), and **verify against the real running app**, not by reading code alone.

## Project

Stayzy — a full-stack hotel booking platform. Users search, compare, book, and pay via Stripe; staff manage inventory through a separate admin panel. Phases 1–8 are complete (Features 01–30). Current work is the AI phase; production deployment comes last.

## Apps

A monorepo of independently deployable apps. **`backend/` is the only service any other app talks to.**

| App | Stack | Port |
| --- | --- | --- |
| `backend/` | Node + Express + TypeScript, Drizzle, PostgreSQL + PostGIS | 4000 |
| `frontend/` | Next.js App Router | 3000 |
| `frontend-admin/` | React + Vite | 5173 |
| `agent/` | Python + FastAPI + LangGraph — **not built yet**, Features 36+ | — |

## Commands

Run from each app's own directory. There is no root-level task runner.

```bash
# backend/
pnpm dev              # tsx watch on :4000
pnpm build            # tsc — also the typecheck
pnpm migrate          # drizzle-kit migrate
pnpm migrate:down     # roll back the newest migration
pnpm seed             # amenities, room features, meal plans, demo hotels
pnpm seed:admin       # admin account (safe to re-run)

# frontend/
pnpm dev              # :3000
pnpm build            # next build
pnpm lint             # eslint
npx tsc --noEmit      # typecheck

# frontend-admin/
pnpm dev              # :5173
pnpm build            # tsc -b && vite build
pnpm lint             # oxlint
```

`backend/` has no lint tooling — `pnpm build` is the check. There is no test suite in any app; features are verified by running the real app against the real seeded database.

## Gotchas

- **Migrations need a hand-written `.down.sql` sibling.** drizzle-kit generates "up" only; `src/config/migrate-down.ts` refuses to roll back without the down file. Migrations live in `backend/drizzle/`, not `backend/migrations/`
- **Use `localhost`, never `127.0.0.1`**, when driving `frontend/` in a browser — Next's dev server only treats `localhost` as an allowed same-origin dev client, and `127.0.0.1` silently breaks the client router in a way that looks exactly like an app bug
- **`frontend/` has its own `AGENTS.md`** warning that this Next.js version differs from training data — read `node_modules/next/dist/docs/` before writing Next-specific code
- `frontend/`'s middleware file is named `proxy.ts`, not `middleware.ts`
- Two separate better-auth instances back user and admin auth, with separate tables and cookie prefixes
- A booking only ever confirms via Stripe webhook — never from a client response or redirect

## Installed skills

`.claude/skills/` holds self-contained, project-local skills (real copies, not symlinks):

- `/architect` — before any complex feature. Think before building.
- `/imprint` — after any new UI component. Capture patterns.
- `/review` — before demo or when something feels off.
- `/recover` — when something breaks after one failed correction.
- `/remember save` — when a feature spans multiple sessions.
- `/remember restore` — when returning after a multi-session feature.

These were originally installed via a skill manager (source: `JavaScript-Mastery-Pro/skills`) into a `.agents/skills/` folder with a `skills-lock.json` tracking upstream versions. That folder and lockfile were removed in favor of standalone copies here, so these skills no longer auto-update from upstream — update them manually if newer versions are needed.
