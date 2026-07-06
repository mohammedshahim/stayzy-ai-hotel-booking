# Code Standards

Implementation rules and conventions for all three apps — `backend/`, `frontend/`, `frontend-admin/`. Claude must follow these in every session without exception. These rules prevent pattern drift across sessions and across apps.

---

## Engineering Mindset

- **Think before implementing** — understand what is being built and why before writing a single line
- **Read context files first** — never assume, always verify against `architecture.md`, `project-overview.md`, and `build-plan.md`
- **Scope is sacred** — only build what the current feature requires, per `build-plan.md`. Never go beyond scope even if it seems helpful
- **Every feature must be testable** — if it cannot be verified immediately after implementation, it is incomplete
- **Clean over clever** — simple readable code that a junior developer can understand is always preferred over clever abstractions
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

```typescript
// backend/src/queries/booking.queries.ts
import { db } from "../config/db";
import type { Booking, CreateBookingInput } from "../models/booking.model";

export async function insertBooking(
  data: CreateBookingInput & { userId: string; status: string },
): Promise<Booking> {
  const { rows } = await db.query<Booking>(
    `INSERT INTO bookings (user_id, hotel_id, room_type_id, check_in, check_out, adults, kids, rooms_booked, total_price, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [data.userId, data.hotelId, data.roomTypeId, data.checkIn, data.checkOut, data.adults, data.kids, data.roomsBooked, data.totalPrice, data.status],
  );
  return rows[0];
}
```

- Parameterized queries only — never string-interpolate values into SQL
- One query function does one thing; compose in the service layer, not by growing one query

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

## File and Folder Naming (all three apps)

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
| `VITE_API_BASE_URL`                   | frontend-admin    | `lib/apiBaseQuery.ts`             |

`NEXT_PUBLIC_` / `VITE_` prefixes mean the variable is exposed to the browser. Never add them to secret keys.

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

- No comments explaining what the code does — code must be self-explanatory
- Comments only for why — a non-obvious decision, a workaround, or an invariant that isn't visible from the code alone
- Never leave TODO comments in committed code

---

## Dependencies

Never install a new package without a clear reason. Before installing anything check:

1. Does shadcn/ui already have this component?
2. Does Next.js / Express already provide this functionality?
3. Is there a simpler native solution?

Approved dependencies:

**backend/** — `express`, `pg`, `better-auth`, `resend` (verification + password reset emails), `stripe`, `@aws-sdk/client-s3`, `zod`, `dotenv`

**frontend/** — `next`, `react`, `better-auth` (client), `@stripe/stripe-js`, `@stripe/react-stripe-js`, `tailwindcss`, `shadcn/ui` components, `lucide-react`, `react-day-picker` + `date-fns` (shadcn's `Calendar` primitive and its date-math peer dependency, added in Feature 05 for the homepage date-range picker), `react-map-gl` + `mapbox-gl` (Map view on `/search`, added in Feature 06 — `mapbox-gl` ships its own TypeScript types, no `@types/` package needed)

**frontend-admin/** — `react`, `vite`, `@reduxjs/toolkit`, `react-redux` (required peer for using the store from components), `react-router-dom`, `tailwindcss`, `shadcn/ui` components, `lucide-react`

Do not install any other packages without updating this list first.
