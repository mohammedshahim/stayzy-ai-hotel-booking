# Architecture

## Stack

| Layer                  | Tool                                       | Purpose                                              |
| ---------------------- | ------------------------------------------- | ----------------------------------------------------- |
| Backend runtime        | Node.js + Express + TypeScript              | Single API serving both frontends                     |
| Database               | PostgreSQL + PostGIS extension              | Relational data + geo queries (map, nearby hotels)    |
| Auth                   | better-auth (self-hosted, Postgres-backed)  | Two separate instances — user auth and admin auth     |
| Payments               | Stripe (PaymentIntents + Webhooks)          | Booking checkout                                      |
| File storage           | S3 bucket                                   | Hotel and room images                                 |
| User frontend          | Next.js (App Router) + TypeScript           | Public booking site                                   |
| Admin frontend         | React + Vite + TypeScript                   | Internal operations panel                             |
| Styling (both)         | Tailwind CSS + shadcn/ui                    | Design system primitives                              |
| Admin data layer       | Redux Toolkit + RTK Query                   | All admin API calls, caching, and state               |
| AI agent (future)      | Not yet implemented                          | Reserved `agent/` folder for the later AI phase       |

This repository is a single monorepo with independent, separately deployable apps at the root:

```
/
├── CLAUDE.md
├── context/
├── backend/
├── frontend/
├── frontend-admin/
└── agent/                      → not implemented yet, reserved for the AI phase
```

Each app has its own `package.json`, dependency tree, and deployment. `backend/` is the only service either frontend talks to — the two frontends never call each other or share a database connection directly.

---

## Folder Structure

### backend/

```
backend/
├── src/
│   ├── server.ts                        → process entrypoint, starts HTTP server
│   ├── app.ts                           → Express app, middleware wiring, route mounting
│   ├── config/
│   │   ├── env.ts                       → typed, validated environment variables
│   │   ├── db.ts                        → PostgreSQL pool + Drizzle db instance (drizzle-orm/node-postgres) wrapping it
│   │   ├── migrate-down.ts              → hand-rolled downgrade runner (rolls back the most recent drizzle-kit migration via its paired .down.sql — see library-docs.md)
│   │   ├── auth.ts                      → better-auth instance for user-facing auth
│   │   ├── auth-admin.ts                → better-auth instance for admin auth (separate table, separate cookie)
│   │   ├── stripe.ts                    → Stripe client instance
│   │   └── s3.ts                        → S3 client instance
│   ├── routes/
│   │   ├── index.ts                     → mounts all routers
│   │   ├── auth.routes.ts
│   │   ├── hotels.routes.ts             → public hotel read endpoints
│   │   ├── search.routes.ts             → GET /search — destination + availability + filters + sort + pagination
│   │   ├── amenities.routes.ts          → public GET — amenity id/name lookup for search filter options
│   │   ├── room-features.routes.ts      → public GET — room feature id/name lookup for search filter options
│   │   ├── meal-plans.routes.ts         → public GET — meal plan id/name lookup for search filter options
│   │   ├── bookings.routes.ts
│   │   ├── payments.routes.ts           → PaymentIntent creation
│   │   ├── reviews.routes.ts
│   │   ├── favorites.routes.ts
│   │   └── admin/
│   │       ├── auth.routes.ts
│   │       ├── hotels.routes.ts         → hotel/room CRUD
│   │       ├── bookings.routes.ts       → confirm/cancel/reallocate
│   │       └── dashboard.routes.ts      → analytics aggregates
│   ├── controllers/                     → one file per route file, request/response only
│   ├── services/                        → business logic, no Express types imported here
│   │   ├── hotel.service.ts
│   │   ├── search.service.ts
│   │   ├── availability.service.ts      → inventory + rate override resolution
│   │   ├── booking.service.ts
│   │   ├── payment.service.ts
│   │   ├── review.service.ts
│   │   └── favorite.service.ts          → guest-cookie to account merge logic lives here
│   ├── models/                          → Drizzle `pgTable(...)` schema files, one per domain (the DB blueprint) — `*.schema.ts`
│   ├── queries/                         → Drizzle query builder functions per model, one file per model — no raw SQL strings
│   ├── webhooks/
│   │   └── stripe.webhook.ts            → verifies signature, moves bookings to confirmed
│   ├── middlewares/
│   │   ├── requireAuth.ts
│   │   ├── requireAdmin.ts
│   │   ├── validateRequest.ts           → zod schema validation
│   │   └── errorHandler.ts
│   ├── types/
│   └── utils/
├── drizzle/                              → drizzle-kit-generated migrations (`<tag>.sql`) + hand-authored `<tag>.down.sql` siblings + meta/ journal
├── drizzle.config.ts                     → drizzle-kit config (schema glob, output folder, DB credentials)
├── package.json
└── tsconfig.json
```

### frontend/ (Next.js, user-facing)

```
frontend/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                                  → Homepage
│   ├── search/page.tsx
│   ├── hotels/[id]/page.tsx
│   ├── favorites/page.tsx
│   ├── compare/page.tsx
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── verify-email/page.tsx
│   ├── checkout/[bookingId]/page.tsx
│   ├── booking-confirmation/[bookingId]/page.tsx
│   ├── bookings/page.tsx
│   ├── bookings/[id]/page.tsx
│   ├── bookings/[id]/review/page.tsx
│   └── profile/page.tsx
├── features/
│   ├── search/
│   │   ├── components/                          → SearchWidget, FilterSidebar, HotelCard, ...
│   │   └── hooks/                                → useSearchResults, useRecentSearches, ...
│   ├── hotel-details/
│   │   ├── components/                           → Gallery, RoomList, ReviewsSection, SimilarHotels, ...
│   │   └── hooks/
│   ├── favorites/
│   │   ├── components/
│   │   └── hooks/                                → useFavorites (cookie + account aware)
│   ├── compare/
│   │   ├── components/                           → CompareTray, CompareTable, ...
│   │   └── hooks/                                → useCompareSelection (persisted client state)
│   ├── booking/
│   │   ├── components/                           → CheckoutSummary, StripePaymentForm, BookingCard, ...
│   │   └── hooks/
│   ├── reviews/
│   │   ├── components/
│   │   └── hooks/
│   └── auth/
│       ├── components/                           → LoginForm, SignupForm, ...
│       └── hooks/
├── components/                                   → shared across features
│   ├── ui/                                       → shadcn/ui primitives only
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   └── common/                                   → EmptyState, Pagination, SkeletonCard, ...
├── lib/
│   ├── api-client.ts                             → typed fetch wrapper to backend/
│   ├── auth-client.ts                             → better-auth client instance
│   └── utils.ts
└── types/
```

### frontend-admin/ (React + Vite)

```
frontend-admin/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── router/
│   │   └── routes.tsx
│   ├── app/
│   │   └── store.ts                              → RTK store setup
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── authApi.ts                        → RTK Query endpoints
│   │   ├── dashboard/
│   │   │   ├── components/
│   │   │   └── dashboardApi.ts
│   │   ├── hotels/
│   │   │   ├── components/                       → HotelForm, RoomTypeForm, ImageManager, ...
│   │   │   ├── hooks/
│   │   │   └── hotelsApi.ts
│   │   └── bookings/
│   │       ├── components/
│   │       ├── hooks/
│   │       └── bookingsApi.ts
│   ├── components/
│   │   ├── ui/                                   → shadcn/ui primitives only
│   │   └── layout/
│   │       ├── Sidebar.tsx
│   │       └── Topbar.tsx
│   ├── lib/
│   │   └── apiBaseQuery.ts                        → shared RTK Query baseQuery against backend/
│   └── types/
└── package.json
```

---

## System Boundaries

| Folder                    | Owns                                                                                       |
| -------------------------- | -------------------------------------------------------------------------------------------- |
| `backend/src/routes`       | HTTP surface only — parses request, calls a controller. No business logic.                  |
| `backend/src/controllers`  | Request/response shaping and status codes. Calls services, never touches the DB directly.   |
| `backend/src/services`     | All business logic — availability math, booking state transitions, review aggregation, favorite merge logic. |
| `backend/src/queries`      | All database access, via the Drizzle query builder. Services never write raw SQL or import `pg`/`drizzle-orm` directly — always through a query function. |
| `backend/src/models`       | Drizzle `pgTable` schema per table (the DB blueprint) plus the application-level row types services/controllers consume. |
| `frontend/features/*`      | Feature-scoped UI + data hooks. A feature never imports another feature's internals directly. |
| `frontend/components`      | Shared, reusable UI only. No data fetching, no feature-specific logic.                       |
| `frontend-admin/features/*`| Feature-scoped UI + RTK Query API slices. Same isolation rule as the user frontend.          |
| `frontend-admin/app/store` | Single RTK store; every feature registers its API slice reducer/middleware here.            |

---

## Data Flow

### Search

```
User submits destination + dates + guests on Homepage or /search
        ↓
frontend calls GET /search (backend)
        ↓
search.service.ts resolves destination → matching hotels
        ↓
availability.service.ts filters to hotels with an available room type for the date range
        ↓
Applies sidebar filters (price, rating, amenities, ...), sort order, and pagination
        ↓
Response includes per-hotel lowest available price and location coordinates for the selected dates
```

`GET /search` accepts a `sort` parameter (`price_asc`, `price_desc`, `guest_rating`, `star_rating`, `distance`) applied after filtering and before pagination. There is no landmarks table or discount column in the schema (Feature 06's mock data invented both for the UI, with no backing) — Feature 09 dropped both from the real search rather than adding schema for them, so `distance` sort has no landmark reference point to measure from. It instead sorts against the centroid (mean lat/lng) of the matched result set itself, computed in `search.service.ts` — not via `ST_Distance`/PostGIS and not via an external geocoding call per search. Every result also carries `hotels.location` so the frontend can render Map view without a second request.

`availability.service.ts`'s per-date effective-inventory/price check (`available_override ?? total_inventory`, `price ?? base_price`) is done in plain JS over `enumerateStayDates(checkIn, checkOut)`, not a SQL `generate_series`/CTE — `queries/search.queries.ts` only ever runs plain `db.select()` builder queries (a date range is always small, so per-date aggregation client-side is simpler than forcing it into one SQL statement). Any future feature needing "is this room type available for these dates" (Feature 12/13's hotel details and room selection) should reuse `findQualifyingRoomTypes`/`pickCheapestPerHotel` rather than re-deriving the math.

### Booking + Payment

```
User selects a room type on a hotel details page and confirms dates/guests
        ↓
POST /bookings (requires auth) — creates a booking row with status pending_payment
        ↓
POST /payments/intent — creates a Stripe PaymentIntent tied to the booking, returns client secret
        ↓
User completes payment on /checkout/[bookingId] via Stripe Elements
        ↓
Stripe sends payment_intent.succeeded to backend/src/webhooks/stripe.webhook.ts
        ↓
Webhook verifies signature, loads booking by payment intent id, moves status → confirmed
        ↓
Booking only ever becomes "confirmed" from the webhook — never from the client redirect
```

A booking that never receives a webhook confirmation within a short expiry window is swept back to `cancelled` by a scheduled cleanup job, releasing its held inventory.

### Reviews

```
Booking reaches status completed (check-out date has passed, booking wasn't cancelled)
        ↓
User submits a rating + description on /bookings/[id]/review
        ↓
review.service.ts upserts the review (one review per booking, enforced by a unique constraint)
        ↓
Hotel's aggregate rating + review count recalculated from all reviews for that hotel
        ↓
Updated aggregate reflected immediately on hotel details and search cards
```

### Favorites (Guest → Account Merge)

```
Guest favorites a hotel — stored against an anonymous session cookie (favorites.session_token)
        ↓
User logs in or signs up
        ↓
favorite.service.ts re-points every favorites row matching that session_token to the user_id
        ↓
Session-token cookie is cleared; favorites are now fully account-scoped
```

### Admin Hotel Management

```
Admin creates/edits a hotel in frontend-admin
        ↓
RTK Query mutation → POST/PATCH /admin/hotels (backend)
        ↓
Address is geocoded server-side; hotels.location (geography Point) is set/updated
        ↓
Room types, amenities, and images are managed as nested resources under the hotel
```

---

## Database Schema

### `user` / `session` / `account` / `verification` (better-auth managed — user-facing)

Standard better-auth core tables. Application-specific fields (e.g. `avatar_url`) are added to `user` via better-auth's additional-fields configuration rather than a separate profile table, so auth and profile data never drift apart.

### `admin_user` / `admin_session` (better-auth managed — admin-facing, separate instance)

A second, independent better-auth instance backs the admin panel. Admin accounts are never stored in the same table as customer accounts — the admin panel has no OAuth, no public sign-up, and a `role` field (`admin` / `super_admin`) that the user-facing auth has no concept of.

### `hotels`

| Column               | Type                | Notes                                        |
| -------------------- | ------------------- | --------------------------------------------- |
| id                   | uuid                |                                                |
| name                 | text                |                                                |
| slug                 | text                | Unique, used in friendly URLs                 |
| description          | text                |                                                |
| address_line1        | text                |                                                |
| address_line2        | text                | Optional                                      |
| city                 | text                |                                                |
| state                | text                | Optional                                      |
| country              | text                |                                                |
| postal_code          | text                | Optional                                      |
| location             | geography(Point,4326) | Set from geocoded address — powers map + nearby queries |
| star_rating          | integer             | 1–5, set by admin                             |
| check_in_time        | time                |                                                |
| check_out_time       | time                |                                                |
| free_cancellation    | boolean             | Hotel-level default; room types may override  |
| cancellation_policy  | text                |                                                |
| status               | text                | draft / published                             |
| average_rating       | numeric             | Denormalized, recalculated on review changes   |
| review_count         | integer             | Denormalized, recalculated on review changes   |
| created_at           | timestamptz         |                                                |
| updated_at           | timestamptz         |                                                |

### `hotel_images`

| Column     | Type        | Notes                            |
| ---------- | ----------- | --------------------------------- |
| id         | uuid        |                                  |
| hotel_id   | uuid        | References hotels                |
| url        | text        | S3 object URL                    |
| is_main    | boolean     | Exactly one true per hotel        |
| sort_order | integer     |                                  |
| created_at | timestamptz |                                  |

### `amenities`

| Column | Type | Notes                              |
| ------ | ---- | ----------------------------------- |
| id     | uuid |                                    |
| name   | text | e.g. Pool, Free Wi-Fi, Gym, Parking |
| icon   | text | Icon identifier for the UI          |

### `hotel_amenities`

Join table: `hotel_id`, `amenity_id`.

### `room_features`

| Column | Type | Notes                                    |
| ------ | ---- | ------------------------------------------ |
| id     | uuid |                                            |
| name   | text | e.g. City View, Balcony, Air Conditioning  |

### `meal_plans`

| Column | Type | Notes                                                      |
| ------ | ---- | ------------------------------------------------------------ |
| id     | uuid |                                                              |
| name   | text | Room Only / Breakfast Included / Half Board / Full Board     |

### `room_types`

| Column             | Type        | Notes                                          |
| ------------------ | ----------- | ------------------------------------------------ |
| id                  | uuid        |                                                  |
| hotel_id            | uuid        | References hotels                                |
| name                | text        | e.g. Deluxe King Room                            |
| description         | text        |                                                  |
| max_adults          | integer     |                                                  |
| max_kids            | integer     |                                                  |
| base_price          | numeric     | Per night, used when no rate override applies    |
| total_inventory     | integer     | Total rooms of this type at the hotel            |
| free_cancellation   | boolean, nullable | `null` inherits the hotel's `free_cancellation` default; `true`/`false` explicitly overrides it |
| meal_plan_id        | uuid        | References meal_plans, nullable                  |
| created_at          | timestamptz |                                                  |
| updated_at          | timestamptz |                                                  |
| deleted_at          | timestamptz | Nullable, soft delete — same pattern as `hotels.deleted_at` |

### `room_type_features`

Join table: `room_type_id`, `room_feature_id`.

### `room_type_images`

Same shape as `hotel_images`, scoped by `room_type_id` instead of `hotel_id`.

### `rate_overrides`

| Column               | Type        | Notes                                              |
| --------------------- | ----------- | ----------------------------------------------------- |
| id                    | uuid        |                                                      |
| room_type_id          | uuid        | References room_types                                |
| date                  | date        |                                                      |
| price                 | numeric     | Overrides base_price for this date, nullable          |
| available_override    | integer     | Overrides effective inventory for this date, nullable |

Unique on `(room_type_id, date)`. Used for seasonal pricing and blackout dates. Rows are always one-per-date; the admin UI accepts a date range and the backend (`rate-override.service.ts`) expands it into individual rows via `upsertRateOverrides` (an `onConflictDoUpdate` upsert, so overlapping ranges replace rather than duplicate), and re-groups consecutive same-value dates back into ranges for display and range delete.

### `bookings`

| Column                | Type        | Notes                                                          |
| ---------------------- | ----------- | ------------------------------------------------------------------ |
| id                     | uuid        |                                                                    |
| user_id                | text/uuid   | References user (better-auth)                                     |
| hotel_id               | uuid        | References hotels                                                  |
| room_type_id           | uuid        | References room_types                                              |
| check_in               | date        |                                                                    |
| check_out              | date        |                                                                    |
| adults                 | integer     |                                                                    |
| kids                   | integer     |                                                                    |
| rooms_booked           | integer     | Number of rooms of this type reserved                              |
| total_price            | numeric     | Computed at booking time from base_price/rate_overrides           |
| status                 | text        | pending_payment / confirmed / cancelled / completed / failed       |
| stripe_payment_intent_id | text      |                                                                    |
| cancelled_at           | timestamptz | Nullable                                                            |
| created_at             | timestamptz |                                                                    |
| updated_at             | timestamptz |                                                                    |

### `reviews`

| Column      | Type        | Notes                                     |
| ----------- | ----------- | -------------------------------------------- |
| id          | uuid        |                                            |
| booking_id  | uuid        | References bookings, unique — one review per booking |
| user_id     | text/uuid   | References user                            |
| hotel_id    | uuid        | References hotels — denormalized for fast lookups |
| rating      | integer     | 1–5                                        |
| description | text        |                                            |
| created_at  | timestamptz |                                            |
| updated_at  | timestamptz |                                            |

### `favorites`

| Column        | Type        | Notes                                                    |
| -------------- | ----------- | ----------------------------------------------------------- |
| id             | uuid        |                                                            |
| user_id        | text/uuid   | Nullable — set once account-scoped                        |
| session_token  | text        | Nullable — set while guest-scoped                          |
| hotel_id       | uuid        | References hotels                                          |
| created_at     | timestamptz |                                                            |

Check constraint: exactly one of `user_id` / `session_token` is non-null. Unique on `(user_id, hotel_id)` and `(session_token, hotel_id)`.

### `recent_searches`

| Column            | Type        | Notes                                    |
| ------------------ | ----------- | ------------------------------------------- |
| id                 | uuid        |                                            |
| user_id            | text/uuid   | Nullable                                    |
| session_token      | text        | Nullable                                    |
| destination_query  | text        |                                            |
| check_in           | date        |                                            |
| check_out          | date        |                                            |
| adults             | integer     |                                            |
| kids               | integer     |                                            |
| rooms              | integer     |                                            |
| searched_at        | timestamptz |                                            |

Same guest/account duality as `favorites`, same merge-on-login behavior.

Trending destinations are **not** a stored table — they are computed on read as a query over `bookings` grouped by `hotels.city`, ordered by count within a recent time window, and cached briefly at the API layer.

---

## PostGIS

PostGIS is a PostgreSQL extension that adds geographic types and functions. It is enabled once per database:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

`hotels.location` is a `geography(Point, 4326)` column (SRID 4326 = standard lat/lng). It is set from `ST_MakePoint(longitude, latitude)::geography` whenever a hotel's address is geocoded.

Common query patterns:

```sql
-- Hotels within 5km of a point, nearest first
SELECT *, ST_Distance(location, ST_MakePoint($1, $2)::geography) AS distance_meters
FROM hotels
WHERE ST_DWithin(location, ST_MakePoint($1, $2)::geography, 5000)
ORDER BY distance_meters ASC;

-- Similar/nearby hotels excluding the current one
SELECT *, ST_Distance(location, (SELECT location FROM hotels WHERE id = $1)) AS distance_meters
FROM hotels
WHERE id != $1
ORDER BY distance_meters ASC
LIMIT 6;
```

A GiST index on `hotels.location` is required for these queries to be fast at scale:

```sql
CREATE INDEX hotels_location_gist_idx ON hotels USING GIST (location);
```

The AI phase's vector-database nearby search (mentioned in the project plan) is a separate, later concern — PostGIS covers all map/nearby needs for the core product.

---

## Stripe Integration

Stripe is integrated through PaymentIntents, not Checkout Sessions, so the payment form can be embedded directly in `/checkout/[bookingId]` via Stripe Elements.

Setup steps (done once, tracked in `build-plan.md`):

1. Create a Stripe account, grab the test-mode publishable and secret keys
2. Add `STRIPE_SECRET_KEY` to `backend/.env`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to `frontend/.env.local`
3. Install `stripe` in `backend/`, `@stripe/stripe-js` + `@stripe/react-stripe-js` in `frontend/`
4. Create a booking → create a PaymentIntent (`amount` from `bookings.total_price`, `metadata.bookingId` set) → return `client_secret` to the frontend
5. Frontend mounts Stripe Elements with the client secret and confirms the payment
6. Register a webhook endpoint (`/webhooks/stripe`) in the Stripe dashboard (or via CLI for local dev with `stripe listen --forward-to`) for `payment_intent.succeeded` and `payment_intent.payment_failed`
7. Webhook handler verifies the Stripe signature header before trusting any event payload

Full request/response shapes and code patterns live in `library-docs.md`.

---

## Authentication

- Two independent better-auth instances: one for `frontend/` (user), one for `frontend-admin/` (admin) — separate tables, separate cookies, separate session lifetimes
- User auth methods: email + password (with email verification), Google OAuth
- Admin auth method: email + password only, accounts provisioned directly in the database — no public admin sign-up
- Protected user routes: `/checkout/[bookingId]`, `/bookings`, `/bookings/[id]`, `/bookings/[id]/review`, `/profile`
- Public user routes: everything else, including search and hotel details — browsing never requires login
- Protected admin routes: everything except `/login`
- A booking cannot be created for an unverified email — verification is enforced at the booking step, not at every route

---

## Invariants

Rules Claude must never violate:

- `backend/src/routes` and `backend/src/controllers` contain no SQL and no business logic — that belongs in `services` and `queries`.
- `services` never import Express request/response types.
- A booking only transitions to `confirmed` from the Stripe webhook handler — never from an API response to the client, never from a redirect callback.
- Room availability is always computed from `room_types.total_inventory` (or `rate_overrides.available_override` for that date) minus overlapping non-cancelled bookings — never trusted from client input.
- `reviews` requires a `completed` booking owned by the reviewing user — enforced in `review.service.ts`, not just in the UI.
- `hotels.average_rating` and `hotels.review_count` are recalculated from `reviews` inside the same transaction as any review create/update/delete — they are never hand-edited elsewhere.
- `favorites` and `recent_searches` rows have exactly one of `user_id` / `session_token` set, never both, never neither.
- Guest-to-account merge (favorites, recent searches) happens once, at login/signup, inside `favorite.service.ts` / the equivalent search-history service — never repeated on every request.
- Admin accounts live only in the admin better-auth tables — never in the user-facing `user` table, and vice versa.
- `frontend/features/*` and `frontend-admin/features/*` never import another feature's internal components or hooks directly — shared UI goes through `components/`.
- All admin API calls go through RTK Query in `frontend-admin/` — no ad hoc `fetch` calls in components.
- No hardcoded hex values or raw Tailwind color classes anywhere — always the CSS variable token classes from `ui-tokens.md`.
