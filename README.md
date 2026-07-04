# Stayzy

Full stack hotel booking platform. See [`context/`](context/) for the full project brief, architecture, build plan, code standards, and UI system — read those before making changes.

## Apps

This is a monorepo of three independent, separately deployable apps. Each has its own `package.json` and lockfile; none share a dependency tree.

| App | Stack | Dev command |
| --- | --- | --- |
| `backend/` | Express + TypeScript | `pnpm dev` |
| `frontend/` | Next.js (App Router) | `pnpm dev` |
| `frontend-admin/` | React + Vite | `pnpm dev` |

## Getting started

Each app is set up the same way:

```bash
cd backend && pnpm install
cd frontend && pnpm install
cd frontend-admin && pnpm install
```

### Backend

1. Copy `backend/.env.example` to `backend/.env` and fill in `DATABASE_URL` — point it at any reachable PostgreSQL instance (local install or a cloud dev database).
2. Run migrations: `cd backend && pnpm migrate`. The first migration enables the PostGIS extension.
3. Start the server: `pnpm dev`. Health check: `GET http://localhost:4000/health`.

### Frontend (user)

`cd frontend && pnpm dev` — runs at `http://localhost:3000`.

### Frontend (admin)

`cd frontend-admin && pnpm dev` — runs at `http://localhost:5173`.

## Docs

- [`context/project-overview.md`](context/project-overview.md) — what Stayzy is, scope, success criteria
- [`context/architecture.md`](context/architecture.md) — stack, folder structure, data flow, invariants
- [`context/build-plan.md`](context/build-plan.md) — phased feature list
- [`context/progress-tracker.md`](context/progress-tracker.md) — current build status, read this first every session
- [`context/code-standards.md`](context/code-standards.md) — conventions for all three apps
- [`context/ui-tokens.md`](context/ui-tokens.md), [`context/ui-rules.md`](context/ui-rules.md), [`context/ui-registry.md`](context/ui-registry.md) — design system
