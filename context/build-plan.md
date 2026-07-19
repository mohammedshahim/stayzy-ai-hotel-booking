# Build Plan

## Core Principle

UI and logic built together for every feature. Every feature must be visible and testable before moving to the next. No invisible backend-only phases beyond what a feature strictly needs before its UI can be wired to it. Mock/static data is acceptable only as an explicit stepping stone toward the next feature in the same phase — never as a stopping point.

The AI phase is broken down in its own companion file, `ai-phase-plan.md` (Features 36–51). **It now runs before deployment, not after** — see the sequencing note on Phase 9 below.

---

## Phase 1 — Foundation

### 01 Monorepo Scaffold

**Logic:**

- `backend/` — Express + TypeScript skeleton, env validation, PostgreSQL connection pool, health check route
- `frontend/` — Next.js App Router + TypeScript + Tailwind + shadcn/ui skeleton
- `frontend-admin/` — Vite + React + TypeScript + Tailwind + shadcn/ui skeleton, Redux Toolkit store wired with an empty root reducer
- PostGIS extension enabled on the database (`CREATE EXTENSION IF NOT EXISTS postgis;`)

**Test:** All three apps start locally. `backend` health check route returns 200. PostGIS extension shows as installed via `\dx` in psql.

---

### 02 Database Schema

**Logic:**

- Migrations for every table in `architecture.md`: `hotels`, `hotel_images`, `amenities`, `hotel_amenities`, `room_features`, `meal_plans`, `room_types`, `room_type_features`, `room_type_images`, `rate_overrides`, `bookings`, `reviews`, `favorites`, `recent_searches`
- GiST index on `hotels.location`
- Seed script with a handful of demo hotels, room types, and amenities for local development

**Test:** All tables exist with correct columns and constraints. Seed script populates demo data without errors.

---

### 03 User Authentication

**UI:**

- `/login`, `/signup`, `/verify-email` pages — clean centered auth cards

**Logic:**

- better-auth instance configured for `frontend/` — email/password + Google OAuth
- Email verification flow (signup sends a verification email; unverified accounts can browse but not book)
- Password reset flow (request + set new password)

**Test:** Sign up with email/password, receive verification email, verify, log in. Sign in with Google, session created. Password reset completes end to end.

---

### 04 Admin Authentication

**UI:**

- Admin `/login` page

**Logic:**

- Separate better-auth instance for `frontend-admin/` — email/password only, no public sign-up
- Seed script creates one initial admin account
- Admin route guard redirects unauthenticated requests to `/login`

**Test:** Log in with the seeded admin account. Visiting any admin route while logged out redirects to `/login`.

---

## Phase 2 — Homepage + Search Foundation

### 05 Homepage UI

**UI:**

- Navbar with logo, login/account state
- Hero search widget — destination input, check-in/check-out date range, guests + rooms breakdown
- Trending destinations section (static placeholder data for now)
- Footer

**Test:** Visit `/`. All sections visible and responsive. Search widget is interactive but does not yet navigate anywhere real.

---

### 06 Search Results UI

**UI:**

- `/search` page — sticky filter sidebar (price, star rating, guest rating, amenities, room features, meals, free cancellation, landmarks)
- Active filter chips above results, removable individually
- Sort dropdown (Recommended, Price low/high, Guest rating, Star rating, Distance) next to the view toggle
- List / Grid / Map view toggle — Map view renders a Mapbox map with a pin per hotel alongside a scrollable list, pins and cards stay in sync (static/mock coordinates for now)
- Hotel card — image, name, star + guest rating, location/distance with a map-pin indicator, room type, price, discount badge, amenities, Favorite/Compare toggles, View Details action
- Pagination controls (hidden in Map view)
- Empty state with a "relax your filters" suggestion

**Test:** Visit `/search` with static/mock hotel data. All filter controls, the sort dropdown, and all three view modes (including Map view pin/card sync) render correctly. Pagination and empty state render correctly with mock data toggled.

---

### 07 Admin Hotel CRUD

**UI:**

- `/hotels` list, `/hotels/new`, `/hotels/[id]` edit — name, description, address, star rating, check-in/out times, cancellation policy, amenities picker, image upload/reorder with one marked main

**Logic:**

- Admin hotel CRUD endpoints in `backend/src/routes/admin/hotels.routes.ts`
- Address geocoded server-side into `hotels.location` on create/update
- Images uploaded to S3, URLs saved to `hotel_images`

**Test:** Create a hotel with images and amenities from the admin panel. Confirm the row in `hotels` has a populated `location`, and images are in the S3 bucket with matching URLs in `hotel_images`.

---

### 08 Admin Room Type CRUD

**UI:**

- Room type management nested under `/hotels/[id]` — name, description, max adults/kids, base price, total inventory, free cancellation toggle, meal plan, room features, images

**Logic:**

- CRUD endpoints for `room_types`, `room_type_features`, `room_type_images`
- Rate override management (per-date price/availability override) for seasonal pricing and blackout dates

**Test:** Add two room types to a seeded hotel with different pricing and inventory. Add a rate override for a specific date and confirm it's stored against the correct `room_type_id` and `date`.

---

### 09 Search Backend Wiring

**Logic:**

- `GET /search` — destination match, date-range availability filter via `availability.service.ts`, sidebar filters, `sort` parameter (price_asc/price_desc/guest_rating/star_rating/distance), pagination
- Each hotel result includes its lowest available price for the selected dates and its `location` coordinates for Map view

**Test:** Search a seeded destination with specific dates. Only hotels with available inventory for those dates appear, with correct filter narrowing, sort ordering, and pagination. Search results UI (including Map view pins) now renders real data instead of mock data.

---

### 10 Recent Searches + Search Suggestions

**Logic:**

- `recent_searches` written on every search, scoped to guest cookie or logged-in user
- Search-while-typing suggestions from previously searched destinations plus known hotel/city names
- Guest recent searches merge into the account on login (same pattern as favorites, see Feature 17)

**Test:** Search as a guest, confirm a `recent_searches` row with `session_token` set. Log in, confirm the row now has `user_id` set and `session_token` cleared. Recent searches show on the homepage.

---

### 11 Trending Destinations

**Logic:**

- Derived query over `bookings` grouped by `hotels.city`, ordered by recent booking volume, cached briefly at the API layer
- Homepage trending section now reads from this endpoint instead of static placeholder data

**Test:** With seeded bookings across a few cities, the trending section reflects the correct ranking.

---

## Phase 3 — Hotel Details

### 12 Hotel Details UI

**UI:**

- `/hotels/[id]` — main image + supporting gallery, description, amenities, policies
- Skeleton loading while data loads

**Logic:**

- `GET /hotels/:id` returns full hotel detail payload

**Test:** Visit a seeded hotel's details page. All sections render with real data. Gallery correctly distinguishes the main image.

---

### 13 Room Selection

**UI:**

- Room type list on hotel details with per-room pricing for the selected dates, remaining inventory, and a Reserve action

**Logic:**

- Room availability for the selected dates resolved through `availability.service.ts`

**Test:** Change dates on the hotel details page and confirm price/availability per room type updates correctly, including when a rate override applies.

---

### 14 Map Integration

**UI:**

- Map showing the hotel's location on the details page, using `hotels.location`

**Test:** Map renders a pin at the correct coordinates for a seeded hotel.

---

### 15 Similar Hotels

**Logic:**

- `ST_DWithin`/`ST_Distance` query for nearby hotels in the same destination, excluding the current hotel, ranked by proximity and rating

**UI:**

- Similar hotels section below the fold on hotel details

**Test:** A seeded hotel with nearby siblings shows them ranked by distance; a hotel with no nearby siblings shows an appropriate empty section (hidden or a short empty state, not a broken layout).

---

### 16 Reviews Display

**UI:**

- Reviews section on hotel details — aggregate rating breakdown + individual reviews list

**Logic:**

- `GET /hotels/:id/reviews`

**Test:** Seed a few reviews for a hotel and confirm the aggregate rating and list render correctly. Review creation itself lands in Phase 6.

---

## Phase 4 — Favorites + Compare

### 17 Favorites

**UI:**

- Favorite toggle on hotel cards and hotel details
- `/favorites` page with a distinct card treatment from search results

**Logic:**

- Guest favorites stored against a session cookie
- On login/signup, `favorite.service.ts` re-points guest favorites to the account and clears the cookie

**Test:** Favorite a hotel as a guest, confirm the cookie-scoped row. Log in, confirm the favorite now shows on `/favorites` and the row is account-scoped in the DB.

---

### 18 Compare Hotels

**UI:**

- Compare toggle on hotel cards, favorites cards, and hotel details
- Floating bottom compare tray, app-wide, once at least one hotel is selected
- `/compare` page — first two hotels shown side by side, third onward scrolls horizontally
- Search box on `/compare` to add hotels directly from that page

**Logic:**

- Compare selection persisted client-side (local storage), no backend table required

**Test:** Add 4 hotels to compare from different pages (search, favorites, details). Tray persists across navigation. `/compare` renders the first two inline and scrolls to reveal the rest.

---

## Phase 5 — Booking, Checkout, Payment

### 19 Booking Creation

**Logic:**

- `POST /bookings` (requires verified auth) — creates a `pending_payment` booking row, holds inventory for the requested dates/room type
- Unauthenticated users are redirected to `/login` with a return path back to checkout

**Test:** Reserve a room while logged out — redirected to login, returns to checkout after signing in. Reserve while logged in — `pending_payment` booking row created with correct price.

---

### 20 Stripe Setup

**Logic:**

- Stripe account created, test-mode keys added to `backend/.env` and `frontend/.env.local`
- `stripe` installed in `backend/`, `@stripe/stripe-js` + `@stripe/react-stripe-js` in `frontend/`
- `POST /payments/intent` creates a PaymentIntent from `bookings.total_price` with `metadata.bookingId` set

**Test:** Creating a booking and calling `/payments/intent` returns a valid `client_secret` from the Stripe dashboard's test-mode logs.

---

### 21 Checkout Page

**UI:**

- `/checkout/[bookingId]` — booking summary (hotel, room, dates, guests, price breakdown) + Stripe Elements payment form

**Test:** Complete a test-mode payment with a Stripe test card. Payment form shows success/error states correctly.

---

### 22 Stripe Webhook

**Logic:**

- `/webhooks/stripe` verifies the signature header, handles `payment_intent.succeeded` (booking → `confirmed`) and `payment_intent.payment_failed` (booking → `failed`)
- Scheduled cleanup sweeps stale `pending_payment` bookings past an expiry window to `cancelled`, releasing held inventory

**Test:** Complete a payment locally with `stripe listen --forward-to`. Confirm the booking flips to `confirmed` only after the webhook fires, never immediately on client redirect. Manually expire a pending booking and confirm the sweep cancels it.

---

### 23 My Bookings

**UI:**

- `/bookings` — list with status badges
- `/bookings/[id]` — full detail + cancellation action (respecting the room type's free-cancellation policy and cutoff)

**Test:** Confirmed booking appears on `/bookings`. Cancel a cancellable booking and confirm status updates and inventory is released. Attempting to cancel outside the free-cancellation window is blocked with a clear message.

---

## Phase 6 — Reviews

### 24 Review Creation

**UI:**

- `/bookings/[id]/review` — star rating + description, editable/removable any time by its author

**Logic:**

- Enforced server-side: booking must belong to the user and be `completed`
- `hotels.average_rating` / `review_count` recalculated in the same transaction as any review create/update/delete

**Test:** Attempt to review a non-completed booking — blocked. Review a completed booking, confirm the hotel's aggregate rating updates immediately on hotel details and search cards. Edit and delete the review, confirm the aggregate updates again each time.

---

## Phase 7 — Admin Operations

### 25 Admin Booking List

**UI:**

- `/bookings` (admin) — filterable by status, hotel, date range

**Test:** Filters correctly narrow the seeded booking set.

---

### 26 Admin Booking Actions

**UI:**

- `/bookings/[id]` (admin) — confirm, cancel, or reallocate to a different room of the same type

**Logic:**

- Cancelling releases held inventory back to availability

**Test:** Cancel a booking from the admin panel and confirm the room type's availability increases for the affected dates.

---

### 27 Admin Dashboard

**UI:**

- `/dashboard` (admin) — total bookings, revenue, occupancy rate, cancellation rate, recent bookings feed, top hotels, upcoming check-ins/check-outs

**Test:** With seeded booking data across multiple hotels and statuses, all dashboard metrics compute correctly against the raw data.

---

## Phase 8 — Polish

### 28 Skeleton Loading

Skeleton states added to search results, hotel details, favorites, compare, bookings, and both admin list views.

**Test:** Throttle network locally and confirm every data-dependent view shows a skeleton, never a blank flash.

---

### 29 Empty States

Empty states added wherever a list can legitimately be empty: search with no results, empty favorites, empty compare, no bookings, no reviews, empty admin lists.

**Test:** Each empty state renders clear copy and, where relevant, a suggested next action.

---

### 30 Responsive Pass

Full responsive audit of both frontends at mobile, tablet, and desktop breakpoints.

**Test:** No horizontal overflow, no overlapping elements, floating compare tray and sticky filter sidebar both degrade gracefully on mobile.

---

## Phase 9 — Deployment

> **Resequenced 2026-07-19: this phase now runs last, as Phase 16.** The AI phase (Features 36–51) runs first. Features 31–35 were never executed, so there is nothing live to disrupt, and deploying once — after the product is feature-complete with AI included — avoids standing up production infrastructure twice. Feature ID numbers are unchanged; only execution order moved. See `ai-phase-plan.md`.
>
> When this phase finally runs, its scope is wider than described below: `agent/` is a fourth deployable app, and Feature 31 must also cover its env vars. See `ai-phase-plan.md`'s Phase 16 section.

### 31 Environment Variables

All production env vars (`backend`, `frontend`, `frontend-admin`) documented and configured in the hosting provider's dashboard.

### 32 Backend Deployment

`backend/` deployed with a production PostgreSQL instance (PostGIS enabled) and production Stripe webhook endpoint registered.

### 33 User Frontend Deployment

`frontend/` deployed, pointed at the production backend URL and production Stripe publishable key.

### 34 Admin Frontend Deployment

`frontend-admin/` deployed, pointed at the production backend URL, access restricted appropriately (e.g. not indexed, ideally on a distinct subdomain).

### 35 Production Smoke Test

Full end-to-end pass in production:

- Sign up → verify email → search → view hotel details → favorite → compare → book → pay → confirm
- Cancel a booking, leave a review on a separate completed booking
- Admin: create a hotel with rooms, confirm it's bookable, manage an incoming booking, check the dashboard

---

## Phases 10–15 — AI Phase (Features 36–51)

Fully planned in **`ai-phase-plan.md`** — read that file, not this section, before starting any AI feature. Summary of what it covers:

- **Phase 10 (36–37)** — `agent/` service scaffold (Python, FastAPI + LangGraph), internal service auth, rate limiting
- **Phase 11 (38–39)** — AI summaries on `/hotels/[id]` and `/compare`, with cache tables
- **Phase 12 (40–42)** — natural-language query extraction, smart search UI, PostGIS `ST_DWithin` nearby search
- **Phase 13 (43–44)** — the chat widget: a read-only navigator that can drive the app's URL state
- **Phase 14 (45–48)** — the `/assistant` chatbot: full tool suite with `interrupt()`-gated mutations
- **Phase 15 (50–51)** — tracing, cost controls, eval pass

Two changes from this file's original framing, both decided during `/architect` on 2026-07-19:

- **This phase runs before deployment**, not after. Deployment becomes Phase 16.
- **The vector database is dropped.** Nearby search uses PostGIS + LLM query extraction instead. A GiST index and working geography queries already exist; a vector DB would add a dependency for a problem PostGIS already solves.

Feature 49 (`InMemorySaver` → `PostgresSaver` swap) was planned and then deleted — the checkpointer uses `PostgresSaver` from Feature 36 in every environment, so there is nothing to swap. The number is retired, not reused.

---

## Phase 16 — Production Deployment

Features 31–35, moved here from Phase 9 above, plus agent service deployment. See `ai-phase-plan.md`'s Phase 16 section for the widened scope.

---

## Feature Count

| Phase                             | Features |
| ---------------------------------- | -------- |
| Phase 1 — Foundation               | 4        |
| Phase 2 — Homepage + Search        | 7        |
| Phase 3 — Hotel Details            | 5        |
| Phase 4 — Favorites + Compare      | 2        |
| Phase 5 — Booking/Checkout/Payment | 5        |
| Phase 6 — Reviews                  | 1        |
| Phase 7 — Admin Operations         | 3        |
| Phase 8 — Polish                   | 3        |
| **Core product subtotal**          | **30**   |
| Phase 10 — Agent Foundation        | 2        |
| Phase 11 — Summary Generator       | 2        |
| Phase 12 — Smart Search            | 3        |
| Phase 13 — Chat Widget             | 2        |
| Phase 14 — Chatbot                 | 4        |
| Phase 15 — Hardening               | 2        |
| **AI phase subtotal**              | **15**   |
| Phase 16 — Deployment (was 9)      | 5        |
| **Total**                          | **50**   |

Feature IDs run 01–51; Feature 49 is retired and unused, so the total is 50 rather than 51. Execution order is Phases 1–8, then 10–15, then 16.
