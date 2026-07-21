# Code Standards

Implementation rules and conventions for all four apps — `backend/`, `frontend/`, `frontend-admin/`, and `agent/` (Python, built in the AI phase). Claude must follow these in every session without exception. These rules prevent pattern drift across sessions and across apps.

---

## Engineering Mindset

- **Think before implementing** — understand what is being built and why before writing a single line
- **Read context files first** — never assume, always verify against `architecture.md`, `project-overview.md`, and `build-plan.md`
- **Scope is sacred** — only build what the current feature requires, per `build-plan.md`. Never go beyond scope even if it seems helpful
- **Every feature must be testable** — if it cannot be verified immediately after implementation, it is incomplete
- **Clean over clever** — simple readable code that a junior developer can understand is always preferred over clever abstractions
- **Comments are the exception, not the habit** — the default is no comment; write one only when the code cannot carry the meaning itself. See **Comments** below for the three tests it must pass
- **One thing at a time** — complete one feature fully before touching the next
- **Money and inventory are not "best effort"** — booking status transitions, availability math, and payment confirmation must be exact and server-verified, never assumed from client state

---

## TypeScript (all three apps)

- Strict mode enabled in every `tsconfig.json` — no exceptions
- Never use `any` — use `unknown` and narrow the type
- Never use type assertions (`as SomeType`) unless absolutely necessary and commented why
- All function parameters and return types explicitly typed
- Use `type` for object shapes and unions — use `interface` only for extendable component props
- All async functions have proper error handling — never let promises float unhandled
- Use `const` by default — only use `let` when reassignment is necessary

---

## Backend Conventions (`backend/`)

### Layered Architecture

Every request flows through the same layers, in order, and never skips one:

```
routes → controllers → services → queries → database
```

- `routes/` — declares the HTTP method + path + middleware chain, calls one controller function. No logic.
- `controllers/` — reads the request, calls a service, shapes the response. No SQL, no business rules.
- `services/` — all business logic: availability math, booking state transitions, review aggregation, favorite merge logic. Never imports `express` types (`Request`, `Response`).
- `queries/` — all SQL, one function per query. Services call these, never write raw SQL inline themselves.
- `models/` — typed row shapes matching the DB schema in `architecture.md`. The blueprint of the database in code.

### Route Handler Pattern

```typescript
// backend/src/routes/bookings.routes.ts
import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { validateRequest } from "../middlewares/validateRequest";
import { createBookingSchema } from "../types/booking.schemas";
import { createBooking } from "../controllers/bookings.controller";

const router = Router();
router.post("/", requireAuth, validateRequest(createBookingSchema), createBooking);
export default router;
```

### Controller Pattern

```typescript
// backend/src/controllers/bookings.controller.ts
import { Request, Response, NextFunction } from "express";
import { createBookingForUser } from "../services/booking.service";

export async function createBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const booking = await createBookingForUser(req.user.id, req.body);
    return res.status(201).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
}
```

- Every controller wraps its work in try/catch and forwards errors to `next(error)` — the central `errorHandler` middleware formats the response
- Always return `{ success: boolean, data?: T, error?: string }` — never return raw data without the wrapper
- Never expose raw internal error messages to the client — log the real error server-side, return a generic message

### Service Pattern

```typescript
// backend/src/services/booking.service.ts
import { getAvailableInventory } from "./availability.service";
import { insertBooking } from "../queries/booking.queries";
import type { CreateBookingInput, Booking } from "../models/booking.model";

export async function createBookingForUser(
  userId: string,
  input: CreateBookingInput,
): Promise<Booking> {
  const available = await getAvailableInventory(input.roomTypeId, input.checkIn, input.checkOut);
  if (available < input.roomsBooked) {
    throw new Error("Not enough rooms available for the selected dates");
  }
  return insertBooking({ ...input, userId, status: "pending_payment" });
}
```

- Services throw plain `Error`s with human-readable messages — the controller/errorHandler decides the HTTP status and shape
- Services never trust availability, price, or ownership from client input — always recompute or re-verify server-side

### Query Pattern

All database access goes through Drizzle (`drizzle-orm`), never raw `pg` calls or hand-written SQL strings — see `library-docs.md`'s "Drizzle ORM" section for the schema-file convention and migration workflow.

```typescript
// backend/src/queries/booking.queries.ts
import { db } from "../config/db";
import { bookings } from "../models/booking.schema";
import type { Booking, BookingInput } from "../models/booking.schema";

export async function insertBooking(
  data: BookingInput,
): Promise<Booking> {
  const [row] = await db.insert(bookings).values(data).returning();
  if (!row) throw new Error("Failed to insert booking");
  return row;
}
```

- Use the Drizzle query builder (`db.select`/`db.insert`/`db.update`/`db.delete`, `eq`/`and`/`sql` helpers) — never a raw SQL string, never the `pg` `Pool` directly
- One query function does one thing; compose in the service layer, not by growing one query
- Multi-statement operations (e.g. delete-then-reinsert a join table, reorder a sequence of rows) run inside `db.transaction(async (tx) => { ... })`, using `tx` for every statement in the block
- A raw `sql` template is only for what the query builder can't express (a PostGIS function, a correlated subquery, `to_char`, etc.) — when a `sql` template interpolates a column from a table other than the query's own `FROM`/join scope, qualify it explicitly (e.g. `` sql`... = "hotels"."id"` ``) since Drizzle renders an interpolated column as its bare unqualified name, which can silently collide with a same-named column in the immediate table

### Request Validation

- Every route that accepts a body validates it with a `zod` schema via the `validateRequest` middleware before the controller runs
- Schemas live next to their domain in `types/*.schemas.ts`

### Error Handling

```typescript
// backend/src/middlewares/errorHandler.ts
import { Request, Response, NextFunction } from "express";

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  console.error(`[${req.method} ${req.path}]`, err);
  const status = (err as { status?: number }).status ?? 500;
  res.status(status).json({ success: false, error: err.message ?? "Internal server error" });
}
```

- Never use empty catch blocks — always log or handle
- Console errors always include a `[METHOD /path]` prefix

---

## Frontend Conventions (`frontend/` — Next.js)

- App Router only — no Pages Router
- All components are Server Components by default
- Only add `"use client"` when the component needs `useState`/`useReducer`, `useEffect`, browser APIs, event listeners, or a client-only third-party library (e.g. Stripe Elements)
- Server Components fetch data by calling the backend API directly (server-side `fetch` with the user's session cookie forwarded) — never re-implement business logic in the Next.js app
- Mutations go through Server Actions in `actions/` (or a feature's `hooks/` when the action is feature-scoped) that call the backend API and `revalidatePath`/`revalidateTag` afterward
- Route Handlers under `app/api/` are used only for things the Next.js app itself must own (e.g. proxying an OAuth redirect) — never for business logic that belongs in `backend/`
- Never fetch directly inside a Client Component when a Server Component can fetch and pass data down as props

### Feature Folder Pattern

```
features/<feature-name>/
├── components/     → child components used only by this feature
└── hooks/          → data hooks and client-side actions for this feature
```

- A feature never imports another feature's `components/` or `hooks/` directly — shared UI goes through the top-level `components/` folder
- `components/ui/` holds shadcn/ui primitives only
- `components/layout/` and `components/common/` hold shared, reused-across-features UI

### Component Structure

```typescript
"use client"; // only if needed

// 1. External imports
import { useState } from "react";
import { Button } from "@/components/ui/button";

// 2. Internal imports
import { HotelCard } from "@/features/search/components/HotelCard";

// 3. Type definitions
type Props = {
  hotelId: string;
  isFavorited: boolean;
};

// 4. Component
export function ComponentName({ hotelId, isFavorited }: Props) {
  // state
  // derived values
  // handlers
  // return JSX
}
```

- Never use default exports for components — always named exports
- Props type defined directly above the component, not in a separate file unless shared across features
- No inline styles — all styling via Tailwind classes using CSS variable tokens from `ui-tokens.md`

### Server Action Pattern

```typescript
// features/booking/hooks/createBooking.ts
"use server";

import { revalidatePath } from "next/cache";
import { apiClient } from "@/lib/api-client";

export async function createBooking(input: CreateBookingInput) {
  try {
    const booking = await apiClient.post("/bookings", input);
    revalidatePath("/bookings");
    return { success: true, data: booking };
  } catch (error) {
    console.error("[actions/createBooking]", error);
    return { success: false, error: "Could not create booking" };
  }
}
```

- Every Server Action has a try/catch and returns `{ success: boolean, data?: T, error?: string }`
- Never throw from a Server Action — always return the error

---

## Admin Frontend Conventions (`frontend-admin/` — React + Vite)

- Functional components only, no class components
- All API calls go through RTK Query — no ad hoc `fetch`/`axios` calls inside components
- One RTK Query API slice per feature (e.g. `hotelsApi.ts`), injected into the single store in `app/store.ts`
- Components read data via the generated hooks (`useGetHotelsQuery`, `useCreateHotelMutation`, ...) — never call `.unwrap()` chains inside JSX beyond a single mutation trigger

### RTK Query API Slice Pattern

```typescript
// features/hotels/hotelsApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/apiBaseQuery";
import type { Hotel, CreateHotelInput } from "./types";

export const hotelsApi = createApi({
  reducerPath: "hotelsApi",
  baseQuery,
  tagTypes: ["Hotel"],
  endpoints: (builder) => ({
    getHotels: builder.query<Hotel[], void>({
      query: () => "/admin/hotels",
      providesTags: ["Hotel"],
    }),
    createHotel: builder.mutation<Hotel, CreateHotelInput>({
      query: (body) => ({ url: "/admin/hotels", method: "POST", body }),
      invalidatesTags: ["Hotel"],
    }),
  }),
});

export const { useGetHotelsQuery, useCreateHotelMutation } = hotelsApi;
```

- Every mutation declares `invalidatesTags`; every query that should reflect that mutation declares matching `providesTags`
- Shared `baseQuery` in `lib/apiBaseQuery.ts` attaches the admin session credentials to every request — never duplicated per slice

### Feature Folder Pattern

```
features/<feature-name>/
├── components/
├── hooks/
└── <feature>Api.ts   → RTK Query slice for this feature
```

Same isolation rule as the user frontend — a feature never imports another feature's internals directly.

---

## Agent Conventions (`agent/` — Python + FastAPI + LangGraph)

Built in the AI phase (Features 36+). Python is the only non-TypeScript app in this repo, so it gets its own rules rather than inheriting the TypeScript ones by analogy.

### Simplicity comes first (read before writing any Python)

**The developer must be able to read any file in `agent/` top to bottom and understand it without tracing indirection.** This outranks cleverness, DRY, extensibility, and every pattern below. LangGraph and FastAPI already bring enough concepts of their own; the code around them stays boring on purpose.

Concretely:

- **Functions by default, classes only for real state.** A class that holds no mutable state and whose methods never call each other is a namespace pretending to be an object — make it module-level functions. `httpx`/LLM clients get a module-level instance, not a wrapper class
- **No accessor triads.** `get_x()` / `open_x()` / `close_x()` around a private global is three ways to touch one variable. Prefer a module-level object created once, plus a lifespan hook if it needs opening and closing
- **No factory + cache for config.** One module-level `settings` object, created at import, is the whole pattern — the same shape as `backend/src/config/env.ts`
- **Named functions over parameterised dispatch.** `get_fast_llm()` / `get_smart_llm()` reads better than `get_llm(use_case=...)` with an enum. Two obvious functions beat one configurable one until there are four or more
- **Docstrings are 1–3 lines.** State what the function does and any non-obvious caveat. Long "why" belongs in `agent/README.md` or here, written once, not re-explained in every file that touches the topic. A tool's docstring is the exception — that one is written for the model and can be as long as the model needs
- **No abstraction with a single implementation.** No base classes, no protocols, no registries, no custom decorators, no dependency-injection helpers beyond FastAPI's own `Depends`
- **Shallow code.** Aim for functions under ~30 lines and nesting under three levels. One comprehension deep, never nested
- **Delete dead code immediately.** An unused model or helper written "for later" is a maintenance cost with no reader benefit

What simplicity does **not** mean: type hints, error handling, and the log prefixes below are all still required. Those make code easier to read, not harder.

When a rule elsewhere in this file conflicts with this section, this section wins — and flag the conflict to the developer rather than silently picking one.

### Python baseline

- Python 3.12+, `pyproject.toml`, dependencies managed with `uv`
- **Full type hints on every function** — parameters and return types, no exceptions. This is the direct equivalent of the TypeScript strict-mode rule
- Never use bare `Any` — narrow the type, same reasoning as `unknown` in TypeScript
- `ruff` for lint and format — no separate `black`/`isort`
- `snake_case` for functions, variables, and module files; `PascalCase` for classes and pydantic models
- Route modules are `<domain>_routes.py` — **not** `<domain>.routes.py`. A dot in a module name makes it unimportable (`from src.api.health.routes import router` looks for a `health` package). The `agent/` folder sketch in `ai-phase-plan.md` uses the dotted form; that is the one place it must not be followed literally
- No bare `except:` — always catch a specific exception, always log with a context prefix

### Layering

`agent/` mirrors the backend's discipline of one responsibility per layer:

```
api/ (routes) → graphs/ or chains/ → clients/ → backend/
```

- `api/` — FastAPI routers. Request/response shaping and dependency injection only. No prompts, no LLM calls, no business logic
- `chains/` — stateless single-shot LLM flows. No graph, no checkpointer, no conversation state
- `graphs/` — stateful multi-turn LangGraph agents. Owns conversation execution state through the checkpointer and nothing else
- `clients/` — the only place outbound HTTP happens. **A tool function never calls `httpx` directly**; it goes through `backend_client.py`
- `schemas/` — pydantic request/response models, one module per route. A model used by exactly one route and small enough to read at a glance may live in that route module instead — a separate file per two-field model is indirection without benefit (see Simplicity)

### Prompts

- Every prompt lives in a `prompts.py` beside the chain or graph that uses it — never inline in a node, a tool, or a route
- Prompts are module-level constants, not f-strings built at call time; variable content is passed as template values
- A prompt change is a behavioral change: re-run the Feature 51 eval set before considering it done

### Tools

- One tool does one thing, with a docstring the model actually reads — the docstring is the tool's interface, so write it for the model, not for a human skimming code
- A tool never invents data. Prices, availability, and hotel facts always come from a real `backend/` call
- Mutating tools are only ever registered on the chatbot graph — never the widget graph
- Every mutating tool is gated behind `interrupt()` before it executes

### Error handling

- Route-level errors are caught by `middlewares/error_handler.py` and returned in the same `{success, data?, error?}` envelope the backend uses — both apps' clients assume it
- Inside a stream, an error is emitted as an `{type:"error"}` SSE event, never a mid-stream exception that truncates the response silently
- Log prefixes match the rest of the repo: `[module/function]`

---

## File and Folder Naming (all three TypeScript apps)

- Folders: kebab-case — `hotel-details`, `room-types`
- Component files: PascalCase — `HotelCard.tsx`, `CompareTray.tsx`
- Utility/service/query files: camelCase or dot-suffixed — `booking.service.ts`, `apiBaseQuery.ts`
- Backend route files: always `<domain>.routes.ts`
- Backend controller files: always `<domain>.controller.ts`
- RTK Query API slice files: always `<domain>Api.ts`
- One component per file — never export multiple components from one file
- Index files only in `components/ui/` — never barrel export from other folders

---

## API Response Shape (backend)

Every backend endpoint returns the same envelope:

```typescript
{ success: boolean; data?: T; error?: string }
```

Never return raw arrays/objects without this wrapper — both frontends assume it.

---

## Error Handling (all three apps)

- Never use empty catch blocks — always log or handle
- Console/log errors always include a context prefix: `[domain/function]` or `[METHOD /path]`
- User-facing errors are always human readable — never expose raw error messages or stack traces to the client
- Backend errors return `status: 500` with a generic message unless the error is a known, intentional client error (e.g. validation, not-enough-inventory) with its own status code

---

## Environment Variables

Never hardcode any key, URL, or secret anywhere in the codebase. Each app has its own `.env` file.

| Variable                             | App              | Used In                          |
| ------------------------------------- | ----------------- | ---------------------------------- |
| `DATABASE_URL`                        | backend           | `config/db.ts`                    |
| `APP_URL`                             | backend           | `config/auth.ts`, `middlewares/cors.ts` |
| `ADMIN_APP_URL`                       | backend           | `config/auth-admin.ts`, `middlewares/cors.ts` |
| `API_URL`                             | backend           | `config/auth-admin.ts` (admin instance's own `baseURL`, since it's called cross-origin, not proxied) |
| `BETTER_AUTH_SECRET`                  | backend           | `config/auth.ts`                  |
| `BETTER_AUTH_ADMIN_SECRET`            | backend           | `config/auth-admin.ts`            |
| `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` | backend      | `config/seed-admin.ts`            |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | backend      | `config/auth.ts`                  |
| `STRIPE_SECRET_KEY`                   | backend           | `config/stripe.ts`                |
| `STRIPE_WEBHOOK_SECRET`               | backend           | `webhooks/stripe.webhook.ts`      |
| `S3_BUCKET` / `S3_REGION` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | backend | `config/s3.ts`   |
| `NEXT_PUBLIC_API_BASE_URL`            | frontend          | `lib/api-client.ts`               |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`  | frontend          | checkout page                     |
| `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`     | frontend          | `features/search/components/MapView.tsx`, `features/hotel-details/components/LocationMapPanel.tsx` |
| `VITE_API_BASE_URL`                   | frontend-admin    | `lib/apiBaseQuery.ts`             |
| `VITE_MAPBOX_ACCESS_TOKEN`            | frontend-admin    | `features/hotels/components/HotelLocationPicker.tsx` |
| `INTERNAL_SERVICE_SECRET`             | backend + agent   | `middlewares/requireInternalService.ts` (Feature 37) / `agent` `api/deps.py` (Feature 38) — same value both sides, **required in both, no default** |
| `INTERNAL_RATE_LIMIT_WINDOW_MS` / `INTERNAL_RATE_LIMIT_MAX` | backend | `middlewares/rateLimit.ts` (Feature 37) — defaults to 120 requests per 60s per acting user |
| `AGENT_BASE_URL`                      | backend           | `services/ai.service.ts` (Feature 38) — defaults to `http://localhost:4100` |
| `AI_RATE_LIMIT_WINDOW_MS` / `AI_RATE_LIMIT_MAX` | backend | `middlewares/rateLimit.ts` (Feature 38) — defaults to 20 requests per 60s **per IP**, since the AI routes are public |
| `AI_REQUEST_TIMEOUT_MS`               | backend           | `services/ai.service.ts` (Feature 38) — 20s, the browser-facing budget |
| `AI_SEED_TIMEOUT_MS`                  | backend           | `config/seed-ai-summaries.ts` (Feature 38) — 300s; nothing is waiting on the CLI, so it can afford a slow model |
| `BACKEND_INTERNAL_URL`                | agent             | `clients/backend_client.py` (Feature 36) — required, no default |
| `OPENROUTER_API_KEY`                  | agent             | `config/llm.py` (Feature 36)                       |
| `OPENROUTER_BASE_URL`                 | agent             | `config/llm.py` — defaults to `https://openrouter.ai/api/v1` |
| `OPENROUTER_MODEL_FAST` / `OPENROUTER_MODEL_SMART` | agent | `config/llm.py` — model per use case, never hardcoded at a call site |
| `AGENT_DATABASE_URL`                  | agent             | `config/checkpointer.py` — same database as `DATABASE_URL`, separate schema (Feature 36) — required, no default |
| `CHECKPOINTER_SCHEMA`                 | agent             | `config/checkpointer.py` — defaults to `agent`; pinned via libpq `search_path` |
| `PORT`                                | agent             | `main.py` — defaults to 4100 |

`agent/` deliberately gives `AGENT_DATABASE_URL` and `BACKEND_INTERNAL_URL` **no localhost default**, unlike `backend/src/config/env.ts:7-9`. A defaulted URL lets an unset production value boot successfully and then fail silently; the Feature 31 audit flagged exactly that on `backend/`. New apps should follow `agent/`'s pattern here, not `backend/`'s.

`NEXT_PUBLIC_` / `VITE_` prefixes mean the variable is exposed to the browser. Never add them to secret keys.

`INTERNAL_SERVICE_SECRET` is shared between exactly two apps and must never reach either frontend. It is compared with `crypto.timingSafeEqual`, following the `CRON_SECRET` precedent in `requireCronSecret.ts`. Unlike `CRON_SECRET` it is **required** in `env.ts` — `backend/` refuses to boot without it, because the alternative is internal routes that 401 silently in production.

---

## Import Aliases

Always use the `@/` alias in both frontends — never relative imports that go up more than one level. The backend uses relative imports within `src/` since it has no bundler-configured alias by default.

```typescript
// Correct (frontend / frontend-admin)
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";

// Never
import { Button } from "../../../components/ui/button";
```

---

## Comments

**Applies to all four apps, every feature. The default is no comment.** A comment is something you justify, not something you add by habit.

- No comments explaining what the code does — code must be self-explanatory
- Comments only for why — a non-obvious decision, a workaround, or an invariant that isn't visible from the code alone
- Never leave TODO comments in committed code

**Before writing a comment, it must pass all three:**

1. **Could better naming remove the need for it?** If yes, rename instead.
2. **Does it survive the code changing?** A comment describing current behaviour rots into a lie. One recording a constraint does not.
3. **Would a competent developer reading this file be wrong without it?** Not "would it help" — would they be *wrong*.

**Keep it to one or two lines.** If the explanation needs a paragraph, it is design rationale, not a comment: it belongs in `progress-tracker.md` (a decision) or `library-docs.md` (a library constraint). Code is the wrong place for it — a reader hits it every time they open the file, and it goes stale silently because nothing verifies it.

Do not restate in a comment what the context files already record. Reference the decision instead of duplicating it — duplicated rationale drifts out of sync, and the copy in the code is the one nobody updates.

`requireCronSecret.ts` is the house style: one line, above the non-obvious bit (the constant-time compare), explaining why that compare is not `===`.

**Recurred 2026-07-21 in Feature 39** — 19 comment lines trimmed to 6 during `/review`, on the developer's second correction. The failure mode both times was the same: duplicating design rationale that `architecture.md` and `progress-tracker.md` already held, and narrating self-evident code. What survived was only what passes test 3 — the deliberate missing FK, the `MAX_TOKENS` floor (too low returns *empty* content, not short), the cross-app constant coupling, and the derived-not-reset state (a reader would "simplify" it back into an effect and reintroduce a lint error). **Write the code first with no comments, then add one only where a reader would be wrong without it.**

**Added 2026-07-20 after Feature 37 shipped over-commented** — an 11-line docstring in `rateLimit.ts` restating design rationale already written in `progress-tracker.md` and `library-docs.md`, plus several comments narrating what the next line plainly did. Trimmed the same day. The rule above already existed and was not followed; these tests exist to make it concrete.

---

## Dependencies

Never install a new package without a clear reason. Before installing anything check:

1. Does shadcn/ui already have this component?
2. Does Next.js / Express already provide this functionality?
3. Is there a simpler native solution?

Approved dependencies:

**backend/** — `express`, `drizzle-orm` + `drizzle-kit` (data layer — see `library-docs.md`'s "Drizzle ORM" section), `pg` (the underlying driver Drizzle and better-auth's pool connect through — never queried directly), `better-auth`, `resend` (verification + password reset emails), `stripe`, `@aws-sdk/client-s3`, `zod`, `dotenv`, `cookie-parser` (reads the guest `stayzy_guest_id` cookie for recent searches/favorites — Express itself doesn't parse cookies without it, added Feature 10)

**frontend/** — `next`, `react`, `better-auth` (client), `@stripe/stripe-js`, `@stripe/react-stripe-js`, `tailwindcss`, `shadcn/ui` components, `lucide-react`, `react-day-picker` + `date-fns` (shadcn's `Calendar` primitive and its date-math peer dependency, added in Feature 05 for the homepage date-range picker), `react-map-gl` + `mapbox-gl` (Map view on `/search`, added in Feature 06 — `mapbox-gl` ships its own TypeScript types, no `@types/` package needed)

**frontend-admin/** — `react`, `vite`, `@reduxjs/toolkit`, `react-redux` (required peer for using the store from components), `react-router-dom`, `tailwindcss`, `shadcn/ui` components, `lucide-react`, `react-map-gl` + `mapbox-gl` (draggable location pin on the hotel edit form, added for the manual-coordinate-override feature — same versions and usage pattern as `frontend/`'s `LocationMapPanel`/`MapView`, no new abstraction)

**agent/** (AI phase, not yet installed) — `fastapi`, `uvicorn`, `langgraph`, `langchain-core`, `langchain-openai` (OpenRouter speaks the OpenAI protocol, so this is the client — no OpenRouter-specific package), `langgraph-checkpoint-postgres`, `pydantic` + `pydantic-settings`, `httpx`, `psycopg` (the checkpointer's driver — never queried directly). Dev only: `pytest`, `ruff`.

Do not install any other packages without updating this list first.
