# Library Docs

Project-specific usage patterns for every third-party library in Stayzy. This file only covers how **we** use each library in **this** project — rules, patterns, and constraints specific to Stayzy, not general documentation.

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
import { Pool } from "pg";

export const auth = betterAuth({
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  secret: process.env.BETTER_AUTH_SECRET!,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  user: {
    additionalFields: {
      avatarUrl: { type: "string", required: false },
    },
  },
});
```

### Admin Instance (`backend/src/config/auth-admin.ts`)

```typescript
import { betterAuth } from "better-auth";
import { Pool } from "pg";

export const authAdmin = betterAuth({
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  secret: process.env.BETTER_AUTH_ADMIN_SECRET!,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  // No socialProviders — admin sign-in is email/password only, no public sign-up route is ever mounted
});
```

**Rules:**

- Mount the user instance's handler under `/api/auth/*` and the admin instance's handler under `/api/admin/auth/*` — never the same path
- `requireAuth` middleware checks the user instance's session; `requireAdmin` middleware checks the admin instance's session — never cross-check one against the other
- A booking-creation route also checks `session.user.emailVerified` — verification is enforced at the booking step, not globally
- Frontend and backend must share a top-level domain (e.g. `stayzy.com` / `api.stayzy.com`) so better-auth's cookie is sent cross-subdomain; CORS on the backend must set `credentials: true` and an explicit `origin`, never `*`, when auth cookies are involved

### Client Usage (`frontend/lib/auth-client.ts`)

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

// Email/password sign up
await authClient.signUp.email({ email, password, name });

// Google OAuth
await authClient.signIn.social({ provider: "google" });

// Get session in a Server Component
import { headers } from "next/headers";
const session = await authClient.getSession({ fetchOptions: { headers: await headers() } });
```

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

Used through the plain `pg` driver — no separate ORM/spatial library needed.

### Setup (once)

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE INDEX hotels_location_gist_idx ON hotels USING GIST (location);
```

### Geocode + Save (`backend/src/services/hotel.service.ts`)

```typescript
import { geocodeAddress } from "./geocoding.service";
import { updateHotelLocation } from "../queries/hotel.queries";

export async function setHotelLocation(hotelId: string, address: string) {
  const { lat, lng } = await geocodeAddress(address);
  await updateHotelLocation(hotelId, lat, lng); // ST_MakePoint(lng, lat)::geography
}
```

```typescript
// backend/src/queries/hotel.queries.ts
export async function updateHotelLocation(hotelId: string, lat: number, lng: number) {
  await db.query(
    `UPDATE hotels SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography WHERE id = $3`,
    [lng, lat, hotelId],
  );
}
```

### Nearby / Similar Hotels Query

```typescript
export async function findNearbyHotels(hotelId: string, limitCount = 6) {
  const { rows } = await db.query(
    `SELECT h.*, ST_Distance(h.location, ref.location) AS distance_meters
     FROM hotels h, (SELECT location FROM hotels WHERE id = $1) ref
     WHERE h.id != $1
     ORDER BY distance_meters ASC
     LIMIT $2`,
    [hotelId, limitCount],
  );
  return rows;
}
```

**Rules:**

- `ST_MakePoint` takes `(longitude, latitude)` — reversed from how people usually say coordinates out loud. Getting this backwards silently produces a valid but wrong point.
- Always cast to `::geography`, not `::geometry` — geography gives distances in meters directly, geometry needs manual SRID/unit handling
- Always query through `ST_DWithin` (uses the GiST index) for "within X meters" filtering, not `ST_Distance(...) < X` alone, which cannot use the index efficiently

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
