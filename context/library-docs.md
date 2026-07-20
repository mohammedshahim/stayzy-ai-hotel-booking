# Library Docs

Project-specific usage patterns for every third-party library in Stayzy, across all four apps. This file only covers how **we** use each library in **this** project — rules, patterns, and constraints specific to Stayzy, not general documentation.

Read the relevant section before implementing any feature that touches these libraries.

---

## Before Using Any Library

1. **Check if a skill is installed** for that library — skills contain up-to-date API documentation and best practices.
2. **Check if an MCP server is configured** for that library — real-time docs beat everything else.
3. **Read this file** for project-specific patterns that override general library knowledge.

Order of authority:

```
MCP server (real-time docs) → Skills (curated docs) → This file (project rules) → General training knowledge
```

Never rely on general training knowledge alone for library APIs — they change frequently and training data may be outdated.

---

## better-auth

Two completely independent instances exist in this project — never let them share tables, cookies, or secrets.

### User Instance (`backend/src/config/auth.ts`)

```typescript
import { betterAuth } from "better-auth";
import { db } from "./db";
import { env } from "./env";
import { sendPasswordResetEmail, sendVerificationEmail } from "../services/email.service";

export const auth = betterAuth({
  database: db,
  secret: env.BETTER_AUTH_SECRET,
  baseURL: `${env.APP_URL}/api/auth`,
  trustedOrigins: [env.APP_URL],
  emailAndPassword: {
    enabled: true,
    // false, not true: sign-up must still create a session immediately so an
    // unverified user can browse. true blocks sign-up from creating a session at
    // all (and blocks sign-in) — verification is enforced only at booking creation.
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail(user.email, url);
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail(user.email, url);
    },
    sendOnSignUp: true,
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },
  user: {
    additionalFields: {
      avatarUrl: { type: "string", required: false },
    },
  },
});
```

`baseURL` points at the path the *browser* actually hits (`APP_URL` is the frontend's origin), not the raw backend port — see the local-dev proxy note below.

### Admin Instance (`backend/src/config/auth-admin.ts`)

```typescript
import { betterAuth } from "better-auth";
import { db } from "./db";
import { env } from "./env";

export const authAdmin = betterAuth({
  database: db,
  secret: env.BETTER_AUTH_ADMIN_SECRET,
  basePath: "/api/admin/auth",
  baseURL: `${env.API_URL}/api/admin/auth`,
  trustedOrigins: [env.ADMIN_APP_URL],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  // No socialProviders — admin sign-in is email/password only, no public sign-up route is ever mounted
  user: {
    modelName: "admin_user",
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "admin" },
    },
  },
  session: { modelName: "admin_session" },
  account: { modelName: "admin_account" },
  verification: { modelName: "admin_verification" },
});
```

**Rules:**

- Mount the user instance's handler under `/api/auth/*` and the admin instance's handler under `/api/admin/auth/*` — never the same path
- `requireAuth` middleware checks the user instance's session; `requireAdmin` middleware checks the admin instance's session — never cross-check one against the other
- A booking-creation route also checks `session.user.emailVerified` — verification is enforced at the booking step, not globally
- Frontend and backend must share a top-level domain in production (e.g. `stayzy.com` / `api.stayzy.com`) so better-auth's cookie is sent cross-subdomain; CORS on the backend must set `credentials: true` and an explicit `origin`, never `*`, when auth cookies are involved
- **Local dev has no shared domain** (`localhost:3000` vs `localhost:4000`), so `frontend/next.config.ts` proxies `/api/auth/:path*` to the backend via `rewrites()`. The browser only ever talks to `localhost:3000`, so the session cookie is same-origin with no `SameSite`/CORS gymnastics — this mirrors the production subdomain setup instead of fighting it.
- **The admin instance (Feature 04) deliberately does not use this proxy trick.** `frontend-admin/` is Vite, not Next.js, and calls the backend directly cross-origin via `lib/apiBaseQuery.ts`'s `credentials: "include"`. `localhost:5173` and `localhost:4000` are same-site (same registrable domain, different port), so no `SameSite` issues arise — `backend/src/middlewares/cors.ts` just needs to echo back whichever of `APP_URL`/`ADMIN_APP_URL` sent the request (never `*`) with `Access-Control-Allow-Credentials: true`. Because there's no proxy, `baseURL`/`trustedOrigins` above point at the backend's own address (`API_URL`) and the admin frontend's real origin (`ADMIN_APP_URL`), not a frontend-facing proxy path like the user instance's `APP_URL`.

### Client Usage (`frontend/lib/auth-client.ts`)

```typescript
import { createAuthClient } from "better-auth/react";

// No baseURL: defaults to same-origin "/api/auth", proxied to backend/ via next.config.ts rewrites.
export const authClient = createAuthClient();

// Email/password sign up
await authClient.signUp.email({ email, password, name, callbackURL: "/verify-email?verified=true" });

// Google OAuth
await authClient.signIn.social({ provider: "google", callbackURL: "/" });

// Get session in a Server Component
import { headers } from "next/headers";
const session = await authClient.getSession({ fetchOptions: { headers: await headers() } });

// Route protection for logged-in-only pages: frontend/proxy.ts (Next.js 16 renamed
// "middleware" to "proxy") checks getSessionCookie() presence only, no network call
```

### Admin Client Usage (`frontend-admin/`)

No better-auth client library — `frontend-admin/`'s approved-dependency list (`code-standards.md`) doesn't include one, and `architecture.md` mandates every admin API call go through RTK Query. `features/auth/authApi.ts` calls the admin instance's REST endpoints directly instead:

```typescript
login: builder.mutation<{ user: AdminUser }, { email: string; password: string }>({
  query: (body) => ({ url: "/api/admin/auth/sign-in/email", method: "POST", body }),
  invalidatesTags: ["AdminSession"],
}),
getSession: builder.query<{ user: AdminUser; session: object } | null, void>({
  query: () => "/api/admin/auth/get-session",
  providesTags: ["AdminSession"],
}),
```

`getSession` returns `null` (HTTP 200) when there's no session — not a 4xx — so RTK Query surfaces it as `data: null`, not `error`. The route guard (`features/auth/components/ProtectedRoute.tsx`) checks `data` for that reason, not `error`.

---

## Stripe

PaymentIntents + Stripe Elements, never Checkout Sessions — the payment form is embedded directly in `/checkout/[bookingId]`.

### Server — Create PaymentIntent (`backend/src/services/payment.service.ts`)

```typescript
import { stripe } from "../config/stripe";
import { getBookingById } from "../queries/booking.queries";

export async function createPaymentIntentForBooking(bookingId: string) {
  const booking = await getBookingById(bookingId);
  if (!booking) throw new Error("Booking not found");
  if (booking.status !== "pending_payment") {
    throw new Error("Booking is not awaiting payment");
  }

  const intent = await stripe.paymentIntents.create({
    amount: Math.round(Number(booking.totalPrice) * 100),
    currency: "usd",
    metadata: { bookingId: booking.id },
  });

  return { clientSecret: intent.client_secret };
}
```

### Server — Webhook (`backend/src/webhooks/stripe.webhook.ts`)

```typescript
import { Request, Response } from "express";
import { stripe } from "../config/stripe";
import { confirmBooking, failBooking } from "../services/booking.service";

export async function handleStripeWebhook(req: Request, res: Response) {
  const signature = req.headers["stripe-signature"] as string;
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (error) {
    console.error("[webhooks/stripe] signature verification failed", error);
    return res.status(400).send("Invalid signature");
  }

  const intent = event.data.object as { metadata: { bookingId: string } };

  if (event.type === "payment_intent.succeeded") {
    await confirmBooking(intent.metadata.bookingId);
  } else if (event.type === "payment_intent.payment_failed") {
    await failBooking(intent.metadata.bookingId);
  }

  res.json({ received: true });
}
```

**Rules:**

- The webhook route must use `express.raw({ type: "application/json" })`, not `express.json()`, so `constructEvent` can verify the raw payload signature
- Booking status only ever becomes `confirmed` inside `confirmBooking`, called from this webhook — never from a client-side redirect handler
- Local development: run `stripe listen --forward-to localhost:PORT/webhooks/stripe` to receive events and get a local webhook secret
- Amounts are always sent to Stripe in the smallest currency unit (cents for USD) — never send a decimal amount directly

### Client — Elements (`frontend/features/booking/components/StripePaymentForm.tsx`)

```typescript
"use client";

import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Mount <Elements stripe={stripePromise} options={{ clientSecret }}> around <PaymentElement />
// On submit: stripe.confirmPayment({ elements, confirmParams: { return_url } })
```

**Rules:**

- `clientSecret` comes from `POST /payments/intent` — never generated or guessed client-side
- After `confirmPayment` redirects back, the confirmation page only shows a "payment received, confirming your booking" state until the booking's own status (polled or refetched) actually reads `confirmed` — it never claims success purely from the redirect

---

## PostGIS

Modeled through a Drizzle `customType` (see "Drizzle ORM" below) since Drizzle has no built-in geography column type — not through a separate spatial library.

### Setup (once, baked into the generated baseline migration)

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

`drizzle-kit generate` doesn't know about Postgres extensions, so `CREATE EXTENSION IF NOT EXISTS postgis;` was hand-prepended to `drizzle/0000_baseline.sql` (with a matching `DROP EXTENSION IF EXISTS postgis;` appended to `0000_baseline.down.sql`) — any future migration that needs a new extension needs the same manual step. The GiST index (`hotels_location_gist_idx`) is declared directly in the table schema (`index("hotels_location_gist_idx").using("gist", table.location)` in `models/hotel.schema.ts`), not a separate migration.

### The `geographyPoint` customType (`backend/src/models/hotel.schema.ts`)

```typescript
import { sql } from "drizzle-orm";
import { customType } from "drizzle-orm/pg-core";

export const geographyPoint = customType<{ data: { latitude: number; longitude: number } }>({
  dataType() {
    return "geography(Point,4326)";
  },
  toDriver(value) {
    return sql`ST_SetSRID(ST_MakePoint(${value.longitude}, ${value.latitude}), 4326)::geography`;
  },
});

export const hotels = pgTable("hotels", {
  // ...
  location: geographyPoint("location").notNull(),
  // ...
});
```

Writing `location: { latitude, longitude }` in `.values()`/`.set()` calls this `toDriver` and inlines the `ST_SetSRID(...)` expression directly — no separate "geocode then update" round trip. There is no `fromDriver`: a single geography column can't fan out into two selected fields on its own, so reads never select `location` raw — they select `ST_Y`/`ST_X` as their own computed fields instead (below).

### Geocode + Save (`backend/src/services/hotel.service.ts`)

```typescript
import { geocodeAddress } from "./geocoding.service";
import { updateHotelLocation } from "../queries/hotel.queries";

export async function setHotelLocation(hotelId: string, address: string) {
  const { lat, lng } = await geocodeAddress(address);
  await updateHotelLocation(hotelId, lat, lng);
}
```

```typescript
// backend/src/queries/hotel.queries.ts
import { eq } from "drizzle-orm";
import { hotels } from "../models/hotel.schema";

export async function updateHotelLocation(hotelId: string, lat: number, lng: number) {
  await db
    .update(hotels)
    .set({ location: { latitude: lat, longitude: lng } })
    .where(eq(hotels.id, hotelId));
}
```

### Reading lat/lng back out (`backend/src/queries/hotels.queries.ts`)

```typescript
import { sql } from "drizzle-orm";
import { hotels } from "../models/hotel.schema";

const HOTEL_COLUMNS = {
  // ...
  latitude: sql<number>`ST_Y(${hotels.location}::geometry)`,
  longitude: sql<number>`ST_X(${hotels.location}::geometry)`,
  // ...
};
```

### Nearby / Similar Hotels Query

```typescript
import { sql } from "drizzle-orm";
import { hotels } from "../models/hotel.schema";
import { db } from "../config/db";

export async function findNearbyHotels(hotelId: string, limitCount = 6) {
  const ref = db.select({ location: hotels.location }).from(hotels).where(sql`${hotels.id} = ${hotelId}`);
  return db
    .select({
      id: hotels.id,
      distanceMeters: sql<number>`ST_Distance(${hotels.location}, (${ref}))`,
    })
    .from(hotels)
    .where(sql`${hotels.id} != ${hotelId}`)
    .orderBy(sql`ST_Distance(${hotels.location}, (${ref}))`)
    .limit(limitCount);
}
```

**Rules:**

- `ST_MakePoint` takes `(longitude, latitude)` — reversed from how people usually say coordinates out loud. Getting this backwards silently produces a valid but wrong point. `geographyPoint`'s `toDriver` is the one place this ordering has to be right — every other call site just passes `{ latitude, longitude }`.
- Always cast to `::geography`, not `::geometry` — geography gives distances in meters directly, geometry needs manual SRID/unit handling. `ST_Y`/`ST_X` (which return plain coordinates, not distances) need the opposite cast: `location::geometry`.
- Always query through `ST_DWithin` (uses the GiST index) for "within X meters" filtering, not `ST_Distance(...) < X` alone, which cannot use the index efficiently
- When a raw `sql` template references a column from a table other than the immediate query's `FROM`/join (e.g. a correlated subquery reaching back to an outer table), qualify it explicitly with the literal table name (`` sql`... = "hotels"."id"` ``) — Drizzle renders an interpolated `PgColumn` as its bare unqualified name, which silently resolves to the wrong column if the inner table happens to have a same-named one (e.g. every table has its own `id`)

---

## Drizzle ORM

The entire data layer (`backend/src/queries/*`, `backend/src/config/db.ts`, both better-auth instances) runs on `drizzle-orm` + `drizzle-kit`, not raw `pg` calls. `pg`'s `Pool` still exists (`backend/src/config/db.ts` exports it as `pool`) but only Drizzle and better-auth's adapter ever touch it — nothing else imports `pg` directly.

### Schema files (`backend/src/models/*.schema.ts`)

One file per domain, mirroring the old `models/*.model.ts` grouping: `hotel.schema.ts`, `room-type.schema.ts`, `booking.schema.ts`, `favorite.schema.ts`, `auth.schema.ts`, `admin-auth.schema.ts`. Each exports its `pgTable(...)` definitions plus the row types the rest of the app imports:

- Where no hand-shaped view type existed before (bookings, reviews, favorites, room types, etc.), the row type is just `typeof someTable.$inferSelect` / `$inferInsert` under the same name a hand-written interface would have used (`Booking`, `BookingInput`, ...).
- Where a hand-shaped "view" type already existed and callers depend on its exact shape — `Hotel` in `hotel.schema.ts` is the example — that interface is kept hand-written, verbatim, alongside the `pgTable`. `Hotel` flattens `location` into `latitude`/`longitude` and formats `checkInTime`/`checkOutTime` as `"HH:MM"`, neither of which is the raw table row shape, so it can never just be `$inferSelect`.
- `timestamp(...)` and `date(...)` columns are declared with `{ mode: "string" }` (timestamps) or left at their default string mode (dates) — not Drizzle's `Date`-object mode — so every row type keeps the same `string` timestamp fields the hand-written interfaces always had.
- `numeric(...)` columns that represent money or ratings use `{ mode: "number" }` so they come back as `number`, not the driver's default `string`.

### `db.ts`

```typescript
// backend/src/config/db.ts
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as hotelSchema from "../models/hotel.schema";
// ...one `import * as` per schema file

export const pool = new Pool({ connectionString: env.DATABASE_URL });
export const schema = { ...hotelSchema, ...roomTypeSchema, ...bookingSchema, ...favoriteSchema, ...authSchema, ...adminAuthSchema };
export const db = drizzle(pool, { schema });
```

`pool` is exported alongside `db` — seed scripts and `migrate-down.ts` need it directly (`pool.end()`, or raw SQL for the migration-tracking table), since `db` itself has no `.end()`/`.connect()`.

### A JS array inside a `sql` template renders as `IN (...)`, not a Postgres array literal

`sql\`... = ANY(${idArray}::uuid[])\`` looks reasonable but is wrong — Drizzle spreads an interpolated JS array into a parenthesized, comma-separated placeholder list (`($1, $2, $3)`), the shape `IN (...)` needs, not a single bound array parameter `ANY(...)` needs. With one element it renders as `($1)`, and Postgres then fails to parse `($1)::uuid[]` as an array literal (`malformed array literal`); with multiple elements `ANY(($1, $2)::uuid[])` is invalid SQL outright. Found while building Feature 09's search filters (`backend/src/queries/search.queries.ts`) — the "hotel has all of these amenity ids" / "room type has all of these room feature ids" correlated subqueries. **Fix:** write `column IN ${idArray}` (no explicit parens, no cast) instead of `column = ANY(${idArray}::type[])` — `IN` is exactly the shape Drizzle already produces for an interpolated array.

### better-auth wiring (`config/auth.ts` / `config/auth-admin.ts`)

```typescript
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { account, session, user, verification } from "../models/auth.schema";
import { db } from "./db";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema: { user, session, account, verification } }),
  // ...
});
```

**Rule:** `drizzleAdapter` resolves a model via `db.query[modelName]`, where `modelName` is literally the string better-auth is configured with (`user`, `session`, ... for the user instance; `admin_user`, `admin_session`, `admin_account`, `admin_verification` for the admin instance, per its `modelName` remapping). That means the **schema object's key** must match the model name exactly — not just point at the right table. This is why `admin-auth.schema.ts` exports `admin_user`/`admin_session`/`admin_account`/`admin_verification` in snake_case instead of the usual camelCase: the export name **is** the lookup key, not a style choice. `db` itself is always the full merged schema (built with every domain's tables) — only the `schema` object passed into each `drizzleAdapter()` call is scoped to that instance's own auth tables.

### Migrations: drizzle-kit generates "up" only — this project adds "down"

`drizzle-kit` has no concept of a down migration — `drizzle-kit generate` only ever produces a forward SQL file from a schema diff. This project adds a **hand-authored discipline** on top, not a drizzle-kit feature:

1. Run `npx drizzle-kit generate` (from `backend/`) after any schema change. It writes `drizzle/<tag>.sql` and updates `drizzle/meta/_journal.json`.
2. **Immediately hand-author `drizzle/<tag>.down.sql`** — a migration that exactly reverses that one `<tag>.sql` file (drop what it created, restore what it altered/dropped). For a migration that only adds a table/column, the down file is just the `DROP`. There is no tool that generates or checks this for you — it must ship in the same commit as the generated `.sql` file, or `pnpm migrate:down` will fail loudly (by design) when it reaches that migration.
3. `pnpm migrate` runs `drizzle-kit migrate`, which applies any not-yet-applied `<tag>.sql` files in journal order and tracks progress in `drizzle.__drizzle_migrations` (schema `drizzle`, table `__drizzle_migrations` — created automatically by drizzle-orm's migrator, not something this project manages).
4. `pnpm migrate:down` (`backend/src/config/migrate-down.ts`) is this project's own script, not a drizzle-kit command:
   - Reads the most recently applied row from `drizzle.__drizzle_migrations` and matches it back to a `drizzle/meta/_journal.json` entry by `created_at`/`when`.
   - Loads that entry's `<tag>.down.sql`, splits it on `--> statement-breakpoint` (the same convention drizzle-kit's own generated files use), and runs every statement inside one transaction.
   - Deletes that migration's row from `__drizzle_migrations` on success, so `drizzle-kit migrate`/`pnpm migrate` sees it as unapplied again and will re-apply it going forward.
   - **Throws instead of silently no-oping if the `.down.sql` file is missing** — a missing down file is a bug in whichever change introduced the migration, not something to paper over at rollback time.
5. Both are one-migration-at-a-time (rolls back exactly the single most recent migration, applies whatever's pending) — there's no "roll back to migration X" shortcut. Multiple rollbacks just call `pnpm migrate:down` repeatedly.

**Rule:** every future schema change's PR/commit must include both the generated `<tag>.sql` and its hand-written `<tag>.down.sql` sibling. There's no CI or drizzle-kit check enforcing this — treat a missing `.down.sql` as an incomplete migration, the same way `progress-tracker.md` treats an undocumented decision as incomplete work.

---

## Geocoding & Maps (Mapbox)

Chosen for this project over Google Maps for simpler pricing/setup. If a different provider is preferred later, only `geocoding.service.ts` and the map component need to change — nothing else depends on the provider directly.

### Geocoding (`backend/src/services/geocoding.service.ts`)

```typescript
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${process.env.MAPBOX_ACCESS_TOKEN}&limit=1`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Geocoding request failed");
  const data = await response.json();
  const [lng, lat] = data.features[0].center;
  return { lat, lng };
}
```

### Map Display (`frontend/features/hotel-details/components/HotelMap.tsx`)

```typescript
"use client";

import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
// new mapboxgl.Map({ container, center: [lng, lat], zoom: 14 })
// new mapboxgl.Marker().setLngLat([lng, lat]).addTo(map)
```

**Rules:**

- Server-side geocoding uses `MAPBOX_ACCESS_TOKEN` (secret scope); client-side map rendering uses `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` (public scope token, restricted to map rendering only in the Mapbox dashboard)
- Geocode on hotel create/update only — never re-geocode on every read

---

## S3

### Upload (`backend/src/services/image.service.ts`)

```typescript
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../config/s3";

export async function uploadHotelImage(hotelId: string, file: Buffer, contentType: string, fileName: string) {
  const key = `hotels/${hotelId}/${Date.now()}-${fileName}`;
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      Body: file,
      ContentType: contentType,
    }),
  );
  return `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`;
}
```

**Storage paths:**

- Hotel images: `hotels/{hotel_id}/{timestamp}-{filename}`
- Room type images: `hotels/{hotel_id}/rooms/{room_type_id}/{timestamp}-{filename}`

**Rules:**

- Uploads happen only through admin hotel/room endpoints — never accept a raw S3 key from client input and trust it without validating it belongs to the hotel being edited
- Bucket is public-read for images (they're rendered on public pages); only the admin-authenticated upload path can write to it

---

## RTK Query (`frontend-admin/`)

### Base Query (`lib/apiBaseQuery.ts`)

```typescript
import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL,
  credentials: "include", // sends the admin better-auth session cookie
});
```

### Store Setup (`app/store.ts`)

```typescript
import { configureStore } from "@reduxjs/toolkit";
import { hotelsApi } from "@/features/hotels/hotelsApi";
import { bookingsApi } from "@/features/bookings/bookingsApi";

export const store = configureStore({
  reducer: {
    [hotelsApi.reducerPath]: hotelsApi.reducer,
    [bookingsApi.reducerPath]: bookingsApi.reducer,
  },
  middleware: (getDefault) =>
    getDefault().concat(hotelsApi.middleware, bookingsApi.middleware),
});
```

**Rules:**

- Every new feature API slice must register its reducer and middleware in `app/store.ts` — a slice that isn't registered silently never caches or refetches correctly
- Use `tagTypes` + `providesTags`/`invalidatesTags` for every query/mutation pair — never manually refetch with `refetch()` as a substitute for correct tagging
- Errors from RTK Query hooks (`{ error }` on the hook result) are surfaced in the UI with human-readable copy — never rendered as the raw error object

---

## Zod

Used on the backend for request validation, shared where practical with the frontend for form validation.

```typescript
import { z } from "zod";

export const createBookingSchema = z.object({
  hotelId: z.string().uuid(),
  roomTypeId: z.string().uuid(),
  checkIn: z.string().date(),
  checkOut: z.string().date(),
  adults: z.number().int().min(1),
  kids: z.number().int().min(0),
  roomsBooked: z.number().int().min(1),
});
```

**Rules:**

- Every backend route handling a body has a schema in `types/*.schemas.ts`
- Never use `.passthrough()` on a schema that touches money, dates, or ownership fields

---

# AI Phase Libraries (Features 36+, not yet installed)

> **Do not write LangGraph or FastAPI code from training knowledge.** LangGraph's API — `StateGraph`, checkpointer packages, `interrupt()`/`Command` resume semantics, and `astream` modes — has changed repeatedly and across major versions. Check for an installed skill or MCP server first, then read the installed package's own docs, before writing a single node. The sections below are **project rules only**, deliberately not API tutorials.

## LangGraph

**Where things live** — see `code-standards.md`'s Agent Conventions. In short: `graphs/` for stateful multi-turn agents, `chains/` for stateless single-shot flows. If it does not need conversation state, it is not a graph.

**Rules:**

- The checkpointer is `PostgresSaver` in **every** environment, including local dev. `InMemorySaver` is for tests only. Developing human-in-the-loop flows on in-memory state hides a real behavioral difference — a paused `interrupt()` survives a restart in production and does not in memory
- Checkpointer schema is created by the library's own `.setup()` call. Never Alembic, never a hand-rolled migration, never a Drizzle table
- `thread_id` is always `chat_sessions.id`. No other identifier is ever used as a thread key
- The checkpointer is **execution** state only. Nothing outside the graph reads it for display — `chat_messages` in `backend/`'s Postgres is the display source of truth
- Every mutating tool is gated behind `interrupt()` before it executes. No exceptions, and none are registered on the widget graph at all
- One ReAct agent plus a tool node. **Not** a multi-agent supervisor — the tool count does not justify one, and adding one is a decision to revisit explicitly, not to drift into
- Tool docstrings are the model's interface to the tool. Write them for the model

## FastAPI

**Rules:**

- Routers live in `api/`, one module per feature, mounted through `api/router.py`
- The internal service secret is validated in `api/deps.py` as a dependency — never inline in a route
- Responses use the same `{success, data?, error?}` envelope as `backend/`, produced centrally by `middlewares/error_handler.py`
- Pydantic models for every request and response — no raw dicts crossing a route boundary. Shared ones live in `schemas/`; a small single-route model may stay in its route module (see `code-standards.md`'s Simplicity section)

## Server-Sent Events (streaming)

Chat replies stream; summaries and query extraction do not. The event vocabulary is defined once, in `agent/src/streaming/events.py`:

```
{type:"token", text}          → append to the in-flight assistant message
{type:"tool_start", name}     → render the tool-status chip
{type:"tool_end"}             → clear the chip
{type:"action", action}       → navigate / compare-toggle proposal (widget)
{type:"interrupt", payload}   → render the confirmation card (chatbot)
{type:"done", messageId}      → finalize
{type:"error", message}       → render inline error + retry
```

**Rules:**

- **`backend/` is a byte pipe.** It authenticates the session, opens the upstream request with the service secret, and pipes the body through with `Content-Type: text/event-stream`. It never parses, buffers, or interprets the stream
- **Persistence is not coupled to the stream.** `agent/` POSTs the finished turn to `/internal/chat/messages` on graph completion, so a closed tab still persists the message
- The frontend uses `fetch` + `response.body.getReader()`, **not `EventSource`** — `EventSource` cannot POST a body
- Streaming lives in exactly one frontend file, `useChatStream`. `lib/api-client.ts` is untouched and continues to serve every non-chat feature
- An error inside a stream is emitted as an `error` event, never a mid-stream exception that truncates the response silently

## OpenRouter

Accessed through `langchain-openai` — OpenRouter speaks the OpenAI protocol, so no OpenRouter-specific package is needed. Configured once in `agent/src/config/llm.py` as a factory returning a client per use case.

**Rules:**

- Model choice is per use case, in config, never hardcoded at a call site: a cheap fast model for summaries and query extraction, a stronger one for the chatbot's tool loop
- `OPENROUTER_API_KEY` lives only in `agent/`'s environment. It never reaches `backend/` and never reaches a browser
- This is the project's first genuinely metered dependency. Per-user rate limiting ships in Feature 37, **before** the first billable feature in Feature 38
- Summaries are cached server-side and regenerate only on a content-hash miss. A cache hit must make no LLM call at all — that is the acceptance test for Feature 38
