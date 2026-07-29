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
- Frontend and backend must share a top-level domain in production (e.g. `stayzy.com` / `api.stayzy.com`); CORS on the backend must set `credentials: true` and an explicit `origin`, never `*`, when auth cookies are involved
- **A shared top-level domain is necessary but not sufficient — better-auth writes host-only cookies unless told not to.** `createCookieGetter` emits no `Domain` attribute at all unless `advanced.crossSubDomainCookies.enabled` is true, so a cookie set on the frontend host is simply never sent to the API host no matter how closely related the two are. Set it on the **user** instance, driven by `COOKIE_DOMAIN` so dev stays host-only:
  ```typescript
  advanced: {
    crossSubDomainCookies: env.COOKIE_DOMAIN
      ? { enabled: true, domain: env.COOKIE_DOMAIN }
      : { enabled: false },
  },
  ```
  The domain must be the shared parent (`.stayzy.com`), not either host. Verify by reading `Set-Cookie`, not by reading the config — and verify in production, since local dev cannot reproduce the failure at all (below).
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

## express-rate-limit (`backend/`)

Added in Feature 37. Version installed is **8.6.0** — well ahead of most training data, so read `node_modules/.pnpm/express-rate-limit@*/node_modules/express-rate-limit/dist/index.d.ts` before using an option you have not used here.

One configured limiter lives in `backend/src/middlewares/rateLimit.ts`. Rules:

- **Key on a user, never an IP.** All internal traffic originates from the single `agent/` process, so an IP key collapses every user into one bucket. `keyGenerator` reads `req.actingUserId`.
- **Never reference `req.ip` inside a `keyGenerator`.** v8 validates for this and warns about unmasked IPv6 addresses. This project has no reason to key on IP at all.
- **Always pass a `handler`.** The library's default response body is a bare string; every response in this app is `{success, error}`. The `handler` writes the envelope explicitly.
- `standardHeaders: true` / `legacyHeaders: false` — emit `RateLimit-*`, not the deprecated `X-RateLimit-*`.
- Counters are **in-memory**: they reset on restart and are per-process. Fine while `backend/` runs as one instance. A multi-instance deployment (Phase 16) needs a shared store, which is a `store:` option, not a rewrite.
- Mount the limiter **after** the auth middleware that sets the key it reads. Reversed, every request keys on the fallback bucket.

The limit that caps OpenRouter spend belongs on the inbound AI routes that call `agent/`, not on `internal/*` — internal traffic is `agent/` reading from `backend/` and costs nothing. See the Feature 37 entry in `progress-tracker.md`.

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

# AI Phase Libraries (Features 36+ — installed and in use since Feature 36)

> **Do not write LangGraph or FastAPI code from training knowledge.** LangGraph's API — `StateGraph`, checkpointer packages, `interrupt()`/`Command` resume semantics, and `astream` modes — has changed repeatedly and across major versions. Check for an installed skill or MCP server first, then read the installed package's own docs, before writing a single node. The sections below are **project rules only**, deliberately not API tutorials.

## LangGraph

**Where things live** — see `code-standards.md`'s Agent Conventions. In short: `graphs/` for stateful multi-turn agents, `chains/` for stateless single-shot flows, `tools/` for tools every surface binds (a tool only one surface binds lives in that graph's own `tools/`). If it does not need conversation state, it is not a graph.

**Rules:**

- The checkpointer is `PostgresSaver` in **every** environment, including local dev. `InMemorySaver` is for tests only. Developing human-in-the-loop flows on in-memory state hides a real behavioral difference — a paused `interrupt()` survives a restart in production and does not in memory
- Checkpointer schema is created by the library's own `.setup()` call. Never Alembic, never a hand-rolled migration, never a Drizzle table
- `thread_id` is supplied by `backend/` in the request body and used **verbatim** — `agent/` never mints, stores, or interprets it. Feature 44 onward it is `chat_sessions.id`; Feature 43 ships `widget:{userId}` because the table does not exist yet, and swapping the two changes no Python
- **A tool loop needs an explicit ceiling.** `recursion_limit` defaults to **10007** in LangGraph 1.2.9 (`langgraph/_internal/_config.py`), not the 25 older versions used, so the library stops nothing. Bound the loop by unbinding the tools after N rounds — the model must then answer in words — and set `recursion_limit` behind it as a backstop. Raising an error instead costs the same tokens and gives the user nothing
- **`stream_mode="messages"` emits every message a node produces, not just LLM output.** Tool results arrive on the same channel, so filter on `AIMessageChunk` before treating a chunk as assistant text
- The checkpointer is **execution** state only. Nothing outside the graph reads it for display — `chat_messages` in `backend/`'s Postgres is the display source of truth
- Every mutating tool is gated behind `interrupt()` before it executes. No exceptions, and none are registered on the widget graph at all. **The `interrupt()` call belongs inside the tool runner** (Feature 46), not in the node that dispatches it, so the gate cannot be lost when a graph is rewired
- **`interrupt()` resumes by re-running its whole node from the start**, verified against the installed package. Two consequences, both load-bearing: everything a runner does before its pause must be a repeatable read, and **a node must dispatch at most one mutating tool call**, or an already-committed sibling call re-commits on resume
- **One confirmation envelope for every mutating tool** — `{action, title, lines: [{label, value}], confirm_label}`, resumed with `{"approved": bool}`, built by `graphs/chatbot/tools/confirm.py`. Anything that is not an explicit approval is a refusal. One shape means one confirmation card, not one per action. It reaches a browser as **camelCase** (`confirmLabel`), converted by a Pydantic `serialization_alias` rather than a hand-rolled key rewrite
- **A paused thread only resumes via `Command(resume=...)`**, verified against LangGraph 1.2.9. Plain input while a pause is pending appends the message, **re-runs the node, and pauses again with a new interrupt id** — it does not resume and it does not count as a refusal. A message arriving mid-pause therefore has to be refused (Feature 47 returns 409), or the model never gets a turn and the user types into a wall
- **Never auto-decline a pause with `Command(resume=..., update=...)`.** It does carry both at once, but the injected message lands **between** the assistant's tool_call and its ToolMessage, which strict OpenAI-protocol providers reject
- **A duplicate resume with nothing pending is a no-op** — no re-run and no second commit, so a double-clicked Confirm cannot book twice
- **`StateSnapshot.interrupts` (from `aget_state`) is how you read what a thread is waiting on**, and what lets a reload re-render a confirmation. **Interrupt ids are regenerated on each re-pause**, so never key anything on them
- **Every tool call in a batch needs a ToolMessage, including one you refuse to run.** A tool_call with no result makes the next model call invalid under the OpenAI protocol
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
{type:"token", text, id}          → append to the assistant message with this id
{type:"drop", id}                 → discard that message entirely (widget)
{type:"tool_start", tool}         → render the tool-status chip
{type:"tool_end", tool, summary}  → clear the chip
{type:"action", kind, label, ...} → navigate / open_hotel / compare proposal (widget)
{type:"interrupt", payload}       → render the confirmation card (chatbot; payload shape shipped in Feature 46, not yet emitted)
{type:"done"}                     → finalize
{type:"error", message}           → render inline error + retry
```

**Rules:**

- **Every frame is `data:`-only, with the kind inside the JSON.** `useChatStream` splits on a blank line and `JSON.parse`s the whole frame, so an `event:` line breaks it. One frame per event, never a multi-line `data:`
- **A reply can be retracted.** A ReAct model routinely answers, calls a tool, then writes the same answer again, so `token` frames carry the id of the message they belong to and `drop` discards one. A client that ignores `drop` renders the paragraph twice
- **`backend/` is a byte pipe.** It authenticates the session, opens the upstream request with the service secret, and pipes the body through with `Content-Type: text/event-stream`. It never parses, buffers, or interprets the stream
- **No timeout on a streaming call.** `AI_REQUEST_TIMEOUT_MS` is a request/response ceiling and would cut a legitimate reply mid-sentence; a client disconnect is what ends a stream
- **Persistence is not coupled to the stream.** `agent/` POSTs the finished turn to `/internal/chat/messages` on graph completion, so a closed tab still persists the message
- The frontend uses `fetch` + `response.body.getReader()`, **not `EventSource`** — `EventSource` cannot POST a body
- Streaming lives in exactly one frontend file, `useChatStream`. `lib/api-client.ts` is untouched and continues to serve every non-chat feature
- An error inside a stream is emitted as an `error` event, never a mid-stream exception that truncates the response silently

## OpenRouter

Accessed through `langchain-openai` — OpenRouter speaks the OpenAI protocol, so no OpenRouter-specific package is needed. Configured once in `agent/src/config/llm.py` as a factory returning a client per use case.

**Rules:**

- Model choice is per use case, in config, never hardcoded at a call site: a cheap fast model for summaries and query extraction, a stronger one for the chatbot's tool loop
- **Temperature is per use case too, and it is set at the call site, not in config.** Prose wants a little variation and extraction wants none: the summary chains take the `get_fast_llm()` default of 0.2, the query extraction chain passes `temperature=0`. Anything whose output is parsed rather than read should be at 0
- `OPENROUTER_API_KEY` lives only in `agent/`'s environment. It never reaches `backend/` and never reaches a browser
- This is the project's first genuinely metered dependency. Per-user rate limiting ships in Feature 37, **before** the first billable feature in Feature 38
- **`stream_usage=True` is set explicitly in `_build()`, and must stay.** `langchain-openai` only default-enables it when no custom `base_url` is set — "many chat completions APIs do not support streaming token usage" (`chat_models/base.py:1217-1236`). OpenRouter is a custom `base_url`, so without it every streamed turn reports **no tokens at all**. OpenRouter does honour `stream_options`, verified live in Feature 50: 22 in / 15 out / 37 total, with `reasoning: 12` broken out
- Summaries are cached server-side and regenerate only on a content-hash miss. A cache hit must make no LLM call at all — that is the acceptance test for Feature 38 (verified: 0.09s cached vs 13.8s on a miss)
- **This is not a blanket "cache every AI call" rule.** Feature 40's query extraction has no cache and no table, deliberately: a free-text prompt is not an enumerable key, so it cannot be warmed and repeats too rarely to earn a lookup. Cache when the key is enumerable; otherwise let the rate limiter be the ceiling. See `architecture.md` for the full rule

**Reasoning models need token headroom — learned the hard way in Feature 38.**

The configured model (`nvidia/nemotron-3-ultra-550b-a55b:free`) thinks before it answers. OpenRouter returns that thinking in a **separate** `reasoning` field, and `response.content` holds the clean answer — so the split is handled for you. The trap is the token ceiling:

- With `max_tokens` set too low, the model is cut off **mid-reasoning** and `content` comes back **empty**, not merely short. The first smoke test with `max_tokens=20` returned pure chain-of-thought and no answer
- Budget for reasoning **plus** output. A 2–3 sentence summary needs ~600, not ~150, because ~100 tokens go to thinking before a word is written. **Structured output needs roughly double prose**: the query extraction chain runs at 1200 for a JSON object far shorter than a summary, because the model reasons through each candidate field before emitting any of them
- **Always treat empty content as a failure**, never as a valid short answer, and never cache it. `services/ai.service.ts` does this explicitly
- Check `usage.completion_tokens_details.reasoning_tokens` when a response looks wrong — if it equals `completion_tokens`, the budget was spent entirely on thinking

**Getting structured output: ask for bare JSON and parse it. Do not reach for `with_structured_output`.** Established in Feature 40.

The obvious move for "return me an object" is LangChain's `with_structured_output(Model)`. It was deliberately not used, for two reasons that both still hold:

- It relies on provider tool-calling or JSON-mode support, and the configured free OpenRouter tier does not guarantee either. A feature that works today would break on a model swap
- A reasoning model does not reliably emit *only* the object. It wraps the answer in a markdown fence, or prefixes it with a sentence, even when told not to

The shape that works, in `chains/smart_search/query_extraction_chain.py`:

1. Ask for one JSON object and nothing else, in the system prompt
2. Regex the **outermost** `{...}` out of the reply (`re.compile(r"\{.*\}", re.DOTALL)`) rather than trusting the whole string to parse
3. Validate with `Model.model_validate(json.loads(...))`
4. Return `None` on any parse or validation failure — the route turns that into a 502 and `backend/`'s `postToAgent` into a null

**A half-parsed object is never returned.** The same rule as empty content: a malformed reply is a failure, not a partial success. This is also the simpler construction, which the `agent/` "simplicity comes first" rule prefers — it is the same plain `ainvoke` call the summary chains make.

**Latency is high and variable.** The same prompt measured 4.2s calling `agent/` directly and 13.8s through the full `backend/` path. Assume 4–15s per call. Anything user-facing needs a warm cache (`pnpm seed:ai-summaries`) or a design that does not block on the model.

**A feature with no cache pays that latency every single time.** Feature 40 measured 6–14.5s per extraction and hit the 20s `AI_REQUEST_TIMEOUT_MS` outright on one prompt, with no warm path to fall back on. Budget the timeout against the *uncached* case whenever there is no cache.

**Verify a model slug before trusting it.** `GET https://openrouter.ai/api/v1/models` lists every id; a wrong slug fails only at the first real call. The configured slug was confirmed present in the catalog during Feature 38.

---

## LangSmith (`agent/`)

Added in Feature 50. **Not a new dependency** — `langsmith` is already a hard dependency of `langchain-core`, so tracing needs no install and no integration code.

- **Tracing is pure environment.** `langchain_core/tracers/context.py:132` calls `langsmith.utils.tracing_is_enabled()`, which reads `LANGSMITH_TRACING` / `LANGSMITH_API_KEY` from `os.environ`. No decorators, no callback handlers, no `Client` construction. Do not write wiring for this
- **`.env` alone does nothing.** `pydantic-settings` parses the file into `Settings` without touching `os.environ`, so the variables never reach the library. `load_dotenv()` in `main.py` is what bridges them, and removing it disables tracing silently — see `architecture.md`
- **Never add `LANGSMITH_*` to `Settings`.** The library reads the environment directly; a second, typed copy on the settings object would be read by nothing and would drift. This is the one place `.env` is deliberately not routed through `Settings`
- **User and thread attribution are automatic.** `langchain_core/runnables/config.py:155-168` promotes every primitive `configurable` key into run metadata, excluding only `api_key`. Both graph routes already pass `thread_id` and `user_id`, so runs arrive attributed and grouped without a `metadata=` argument anywhere. Adding one by hand duplicates what the library already did
- **Cost is blank, and that is not a bug.** LangSmith prices runs from its own model table, which has no entry for an OpenRouter slug like `nvidia/nemotron-3-ultra-550b-a55b:free`. Tokens are recorded; dollars require registering that slug's pricing in the LangSmith console. Both configured slugs are free, so the honest figure is $0 either way
- **A trace carries the entire transcript.** `LANGSMITH_HIDE_INPUTS` / `HIDE_OUTPUTS` (`langsmith/client.py:1343`) send structure and tokens without the text. They are deliberately unused — the Feature 48 bug class, a tool docstring the model misread, is invisible without the prompt. The switch is the control instead

---

## react-markdown (`frontend/`)

Added in Feature 44 to render assistant chat replies. The widget model emits `**bold**` and the occasional list on its own, so a raw string showed literal markdown markers.

- **One shared component: `frontend/features/chat/components/ChatMarkdown.tsx`.** Feature 48's chatbot mounts the same renderer — do not write a second one. Build it here, reuse it there.
- **`remark-gfm` and nothing else — no `rehype-*`.** Commonmark alone was the rule until Feature 48, on the reasoning that the model only uses bold, links, short lists and inline code. Tables broke it: asked to compare hotels the model writes a GFM pipe table, which commonmark renders as literal `| Hotel | Price |` text. That is the "a real reply needs a feature commonmark lacks" case the original rule allowed for, so the plugin went in. **The bar for the next one is unchanged** — a plugin is attack surface plus bundle weight on a client component, so add one only against a reply you have actually seen render wrong.
- **A GFM table needs its own renderers and its own scroll container.** `table`/`thead`/`tr`/`th`/`td` all map to tokens like every other element, and the table sits inside a `overflow-x-auto` wrapper so a wide comparison scrolls itself instead of pushing the page sideways. Verified at 390px.
- **Every element maps to a design token**, never a default browser style: `strong` → `font-semibold`, `a` → `text-accent-text underline`, inline `code` → `bg-subtle font-mono text-xs`, list/paragraph spacing via `mb-2 last:mb-0`. A bare `<ReactMarkdown>` with no `components` overrides is drift — it renders blue underlined links and serif code that belong to no other surface.
- **Assistant messages only.** User bubbles stay plain `whitespace-pre-wrap` text — a user's literal `*` is not markup. The assistant bubble drops `whitespace-pre-wrap` because the renderer owns paragraph spacing; keeping both double-spaces every reply.
- **Streaming is fine.** `ChatMarkdown` re-parses on each token as `reply` grows; a momentarily-unbalanced `**` mid-stream resolves the instant its closer arrives. No special handling needed for partial markdown.

---

## @base-ui/react Drawer (`frontend/`)

Used directly for the first time in Feature 48, for `/assistant`'s mobile session list. **`@base-ui/react` is not a new dependency** — it is what this project's shadcn primitives are built on (`components/ui/popover.tsx` imports `@base-ui/react/popover`), so the drawer was already installed.

- **Read `node_modules/@base-ui/react/docs/react/components/drawer.md` before writing one.** It is shipped with the package and is authoritative; it opens by saying so. The package was renamed from `@base-ui-components/react`, so older examples import the wrong name.
- **The parts are `Root → Portal → Backdrop → Viewport → Popup`,** plus `Title` (use `sr-only` when the drawer has its own visible header). Skipping `Viewport` leaves the popup unpositioned — positioning is yours, the library does not place it.
- **`swipeDirection` sets which way dismisses it and defaults to `"down"`** (a bottom sheet). A left-anchored navigation drawer needs `swipeDirection="left"` or the swipe gesture fights the panel.
- **Animate with `data-starting-style` / `data-ending-style` and the `--drawer-swipe-movement-x|y` variable.** The docs' own examples use `[transform:translateX(var(--drawer-swipe-movement-x))]` so the panel tracks the finger; a plain CSS transition without it snaps instead of dragging.
- **Backdrop, focus trap, Esc and scroll-lock come free** with the default `modal`. This is why it beat hand-rolling the widget's `fixed inset-0` takeover for a surface that needs to trap focus.
- **It lives in the feature that uses it, not `components/ui/`,** while there is exactly one consumer — see the Chatbot Page entry in `ui-registry.md` for when to promote it.
