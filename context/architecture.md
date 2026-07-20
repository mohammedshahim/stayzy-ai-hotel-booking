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
| AI agent               | Python + FastAPI + LangGraph                | Summaries, query extraction, chat widget, chatbot     |
| LLM provider           | OpenRouter (provider-agnostic)              | Model chosen per use case in `agent/src/config/llm.py` |

This repository is a single monorepo with independent, separately deployable apps at the root:

```
/
├── CLAUDE.md
├── context/
├── backend/
├── frontend/
├── frontend-admin/
└── agent/                      → Python; built in the AI phase (Features 36+)
```

Each app has its own dependency manifest (`package.json`, or `pyproject.toml` for `agent/`) and its own deployment. **`backend/` is the only service any other app talks to** — the two frontends never call each other, never call `agent/`, and never share a database connection directly. `agent/` is reached only through `backend/`, and calls back only into `backend/`'s `internal/*` routes.

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
│   │   ├── hotels.routes.ts             → public hotel read endpoints, plus GET /hotels/compare?ids= and GET /hotels/search-suggestions?q= (Feature 18 — both mounted before /:id)
│   │   ├── search.routes.ts             → GET /search — destination + availability + filters + sort + pagination
│   │   ├── amenities.routes.ts          → public GET — amenity id/name lookup for search filter options
│   │   ├── room-features.routes.ts      → public GET — room feature id/name lookup for search filter options
│   │   ├── meal-plans.routes.ts         → public GET — meal plan id/name lookup for search filter options
│   │   ├── recent-searches.routes.ts    → public GET — owner's last 5 distinct-tuple searches, for the homepage
│   │   ├── search-suggestions.routes.ts → public GET ?q= — destination-input autocomplete (recent + place matches)
│   │   ├── bookings.routes.ts           → POST / (requireAuth, Feature 19), GET /:id (owner-scoped, backs /checkout) — /payments/intent below is still Feature 20
│   │   ├── payments.routes.ts           → PaymentIntent creation
│   │   ├── reviews.routes.ts            → review submission (Feature 24, not yet built) — GET /hotels/:id/reviews (Feature 16, read-only) lives in hotels.routes.ts instead, alongside /similar/room-types
│   │   ├── favorites.routes.ts          → GET /favorites (full card data), GET /favorites/hotel-ids (bulk id set), POST /favorites, DELETE /favorites/:hotelId — all owner-scoped via resolveOwner (Feature 17)
│   │   └── admin/
│   │       ├── auth.routes.ts
│   │       ├── hotels.routes.ts         → hotel/room CRUD
│   │       ├── bookings.routes.ts       → confirm/cancel/reallocate
│   │       └── dashboard.routes.ts      → analytics aggregates
│   ├── controllers/                     → one file per route file, request/response only
│   ├── services/                        → business logic, no Express types imported here
│   │   ├── hotel.service.ts
│   │   ├── search.service.ts
│   │   ├── availability.service.ts      → inventory + rate override + (since Feature 19) overlapping-booking resolution — HELD_BOOKING_STATUSES, buildBookedCountsByRoomType
│   │   ├── booking.service.ts           → createBookingForUser (Feature 19) — locked-row re-check + insert in one db.transaction
│   │   ├── payment.service.ts
│   │   ├── review.service.ts
│   │   ├── recent-search.service.ts     → record/list/suggest + guest-cookie to account merge
│   │   └── favorite.service.ts          → list/add/remove + guest-cookie to account merge (Feature 17)
│   ├── models/                          → Drizzle `pgTable(...)` schema files, one per domain (the DB blueprint) — `*.schema.ts`
│   ├── queries/                         → Drizzle query builder functions per model, one file per model — no raw SQL strings
│   ├── webhooks/
│   │   └── stripe.webhook.ts            → verifies signature, moves bookings to confirmed
│   ├── middlewares/
│   │   ├── requireAuth.ts
│   │   ├── requireAdmin.ts
│   │   ├── requireInternalService.ts    → guards internal/*; shared secret + acting user (Feature 37)
│   │   ├── rateLimit.ts                 → internalRateLimit, per acting user (37); aiRateLimit, per IP (38)
│   │   ├── validateRequest.ts           → zod schema validation
│   │   └── errorHandler.ts
│   ├── types/
│   └── utils/
│       └── resolveOwner.ts              → logged-in user id, or a guest stayzy_guest_id cookie (minted on first use)
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
│   │   ├── components/                          → SearchWidget, FilterSidebar, HotelCard, DestinationInput (destination + suggestions dropdown), ...
│   │   └── hooks/                                → useSearchResults, useSearchSuggestions, ...
│   ├── recent-searches/                          → homepage-only, sibling feature to search/ (not a subfolder of it, same pattern as trending-destinations/)
│   │   ├── components/                           → RecentSearches
│   │   └── hooks/                                → useRecentSearches
│   ├── hotel-details/
│   │   ├── components/                           → Gallery, RoomList, ReviewsSection, SimilarHotels, ...
│   │   └── hooks/
│   ├── favorites/
│   │   ├── components/                           → FavoritesPageContent, FavoritesCard (Feature 17)
│   │   └── hooks/                                → useFavoriteHotelIds (bulk id set + optimistic toggle, shared with HotelCard/hotel-details), useFavoritesList (full list + local removal, /favorites page only) — Feature 17
│   ├── compare/
│   │   ├── components/                           → CompareProvider (Context, mounted in app/layout.tsx), CompareTray, CompareTraySpacer, CompareTable, CompareSearchBox, ComparePageContent, CompareNavIcon — Feature 18
│   │   └── hooks/                                → useCompareSelection (Context consumer), useCompareHotels (shared fetch hook), useCompareSuggestions — Feature 18
│   ├── booking/
│   │   ├── components/                           → CheckoutPageContent, BookingSummaryCard, CheckoutSkeleton (Feature 19) — StripePaymentForm still doesn't exist, Feature 21's job
│   │   └── hooks/                                → useCreateBooking, useBookingSummary, useReserveRoom (shared by RoomTypeCard's click + RoomSelectionSection's autoReserve effect) — Feature 19
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

### agent/ (Python + FastAPI + LangGraph)

Built in the AI phase. Full structure and per-file responsibilities live in `ai-phase-plan.md` — this is the shape:

```
agent/
├── src/
│   ├── main.py                  → FastAPI entrypoint
│   ├── config/                  → settings, OpenRouter LLM factory, PostgresSaver checkpointer
│   ├── api/                     → routers + deps.py (validates the internal service secret)
│   ├── graphs/                  → stateful multi-turn LangGraph agents (chatbot, chat_widget)
│   ├── chains/                  → stateless single-shot LLM flows (summaries, query extraction)
│   ├── clients/backend_client.py → internal-only httpx client back into backend/
│   ├── schemas/                 → pydantic request/response models
│   ├── streaming/events.py      → the SSE event vocabulary, defined once
│   ├── middlewares/
│   └── utils/
├── tests/
├── pyproject.toml
└── .env
```

No `alembic/` and no `models/` for business data. `agent/` owns no product tables — its only database footprint is the LangGraph checkpointer, in its own schema, created by the library's own `.setup()`.

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
| `backend/src/routes/internal` | The only surface `agent/` may call. Thin wrappers around existing services — no new business logic ever lands here. |
| `agent/src/chains`        | Stateless single-shot LLM flows. No graph, no checkpointer, no conversation state.            |
| `agent/src/graphs`        | Stateful multi-turn LangGraph agents. Owns conversation execution state via the checkpointer, nothing else. |
| `agent/src/clients`       | The only place `agent/` makes outbound HTTP calls. Tools never call `httpx` directly.        |

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

### Recent Searches + Search Suggestions

```
GET /search resolves owner via utils/resolveOwner.ts (logged-in user id, or a guest
session_token cookie — minted on first visit, name stayzy_guest_id)
        ↓
recent-search.service.ts's recordSearchIfChanged compares (destination, checkIn,
checkOut, adults, kids, rooms) against that owner's single most-recent recent_searches
row — inserts a new row only if the tuple actually changed
        ↓
Homepage GET /recent-searches lists the owner's last 5 distinct-tuple searches
        ↓
Destination input's GET /search-suggestions merges the owner's own past destinations
with hotels.city/country matches into one dropdown, tagged "recent" vs "place"
```

Recording rides along with every `GET /search` response (`Promise.all` alongside `searchHotels`) rather than a dedicated "log this search" call from the frontend — this way it fires identically whether the search came from the homepage widget, a bookmarked `/search` URL, or the back button, and sort/filter/pagination changes on the same destination+dates+guests never spam the table (those fields aren't part of the table's identity tuple). Recording is best-effort: a failure there never fails the search response itself.

"Place" suggestions render as `"City, Country"` — `findCandidateHotels` (`search.queries.ts`) matches that combined form via a third `ilike` branch against the concatenated `` `city || ', ' || country` `` in addition to matching city/country individually, so both a bare city/country and the full suggestion label resolve to the same hotels. (Bug found post-launch via `/review`: the combined form originally matched neither column alone, so every place suggestion returned zero results.)

### Trending Destinations

```
GET /trending-destinations groups published hotels by (city, country)
        ↓
Ranked by hotel count descending, hotels.averageRating as tiebreaker
        ↓
Top 8 cities returned, each with the main image of that city's
highest-rated hotel (hotel_images.is_main = true)
        ↓
Homepage's TrendingDestinations.tsx renders real cards, linking into
/search?destination="City, Country" (same combined format as place suggestions)
```

This ranks by hotel count, not real booking volume, because `bookings` doesn't exist until Phase 5 — `build-plan.md`'s Feature 11 spec calls for "ordered by recent booking volume." The ranking query (`findTopCitiesByHotelCount` in `trending-destinations.queries.ts`) is isolated from the rest of the read path specifically so that once bookings exist, only that one query needs to change — the endpoint contract, service shape, and frontend all stay the same. No caching layer was added (decided during `/architect` — the query is cheap and there's no cache infra anywhere else in this project yet; add one later only if it becomes a real cost).

### Hotel Details

```
GET /hotels/:id — public, no auth
        ↓
hotel.service.ts's getPublishedHotelDetails: getHotelById, gated to
status === "published" (draft/missing/deleted all → null)
        ↓
Attaches amenities (hotel_amenities join) + images (hotel_images) —
same HotelWithDetails shape the admin GET /admin/hotels/:id already returns
        ↓
404 if null; else 200 with the full payload
        ↓
/hotels/[id] (frontend/app/hotels/[id]/page.tsx) — thin Server Component
awaiting the route param, wrapping the Client Component HotelDetailsContent
        ↓
useHotelDetails(id) fetches via apiClient, drives a skeleton (locked
`bg-subtle animate-pulse rounded-xl` pattern) while loading, and an
EmptyState ("Hotel not found") on any fetch failure — draft/missing/deleted
are indistinguishable from a genuine error at the frontend, same limitation
every other apiClient-based hook in this app already has
```

Reuses the admin's existing `attachDetails`-shaped payload rather than inventing a second response shape — `getPublishedHotelDetails` duplicates the small amenities+images join rather than calling `attachDetails` itself, since `attachDetails` intentionally throws for the admin's always-exists expectation and this endpoint needs a `null` return instead (see Architecture Decisions). Amenity icons (`amenities.icon`, e.g. `"wifi"`, `"pool"`) are rendered for the first time here via a small icon-slug → lucide-icon lookup (`features/hotel-details/lib/amenity-icons.ts`) — every other feature that lists amenities (`FilterSidebar`) has stayed text-only until now.

### Room Selection (Feature 13)

```
GET /hotels/:id/room-types?checkIn&checkOut&adults&kids&rooms — public,
sibling to GET /hotels/:id, not folded into it (date-dependent, re-fetched
on every date/guest change instead of once on page load)
        ↓
hotels.controller.ts's getHotelRoomTypes: same published/non-deleted 404
check as GET /hotels/:id, then room-type.service.ts's
listRoomTypesWithAvailability
        ↓
listRoomTypesForHotel(hotelId) (existing, previously admin-only — description
+ capacity + images + features) filtered to room types whose maxAdults/
maxKids fit the party (same capacity-filter behavior as GET /search)
        ↓
availability.service.ts's resolveRoomTypeAvailability (new, generalizes
findQualifyingRoomTypes's per-night rate-override loop) returns
remainingInventory (min effective inventory across the stay) and
avgNightlyPrice per room type — sold-out room types (remainingInventory <
rooms) are kept in the list with isSoldOut: true, not dropped, since this
is a single-hotel page where a room type vanishing would read as a bug
        ↓
RoomSelectionSection (frontend/features/hotel-details/) owns local
checkIn/checkOut/adults/kids/rooms state — seeded from the search page's
URL params (HotelCard's link now carries them forward) but not itself
synced back to this page's URL — reusing DateRangePicker/GuestsRoomsPicker
from features/search/components/ verbatim
        ↓
useRoomTypes(hotelId, search) re-fetches on every change (AbortController +
forQuery-comparison pattern, same shape as useSearchResults), rendering
RoomTypeCard per room type — Reserve was a real, always-disabled button
("Coming soon" / "Sold out") until Feature 19 wired it to POST /bookings
(see that feature's data-flow section below)
```

### Map Integration (Feature 14)

```
No new endpoint — GET /hotels/:id already returns latitude/longitude
(hotels.queries.ts's HOTEL_COLUMNS derives them from hotels.location via
ST_Y/ST_X); Feature 12 just hadn't typed or rendered them on the frontend
yet
        ↓
HotelDetailsContent now renders a ui-rules.md-specified two-column layout
below the gallery/title header: grid gap-8 lg:grid-cols-[1fr_22rem], main
column (description, amenities, room selection, policies) + a sticky
lg:top-20 right rail
        ↓
LocationMapPanel (frontend/features/hotel-details/) — right rail's first
panel, a react-map-gl single-pin map (same mapStyle as search's MapView,
no pan/select logic needed for one point) plus a "Get directions" link
out to Google Maps, built from the hotel's own lat/lng — no click handler,
no popup
```

The booking summary panel `ui-rules.md` originally specified for this right rail never materialized here — by Feature 19, room selection's own Reserve flow (main column, per room type) made a redundant rail summary unnecessary. The booking summary card instead lives on `/checkout/[bookingId]`'s own right rail (see Feature 19's data-flow section below), matching `ui-rules.md`'s separately-specified Checkout Layout.

### Similar Hotels (Feature 15)

```
GET /hotels/:id/similar
        ↓
hotels.controller.ts's getHotelSimilar calls getPublishedHotelDetails(id) first
(same 404-check every other hotel-details endpoint does) — this also hands
back the current hotel's own city/country/latitude/longitude, already
computed via HOTEL_COLUMNS's ST_Y/ST_X, with no second lookup needed
        ↓
hotel.service.ts's getSimilarHotels passes those fields straight into
hotels.queries.ts's findSimilarHotels
        ↓
findSimilarHotels builds a reference point (ST_SetSRID(ST_MakePoint(lng,
lat), 4326)::geography) from the already-known coordinates, filters to
published/non-deleted hotels in the same city+country excluding the
current hotel, and orders by ST_Distance ascending — the GiST index on
hotels.location (see PostGIS section) makes this fast — LIMIT 6, no
rating factored into ranking (kept deliberately simple, see
progress-tracker.md's Feature 15 Architecture Decision)
        ↓
SimilarHotelsSection (frontend/features/hotel-details/) renders the result
as a card grid in HotelDetailsContent's main column, after PoliciesSection
— renders nothing at all when the list is empty (no map/dates/party-size
context exists on this page, so pricing isn't computed or shown)
```

### Reviews — Display (Feature 16)

```
GET /hotels/:id/reviews?page&pageSize
        ↓
hotels.controller.ts's getHotelReviews calls getPublishedHotelDetails(id)
first (same 404-check every other hotel-details endpoint does)
        ↓
review.service.ts's getHotelReviews counts real reviews.hotelId rows first
        ↓
count === 0 (no booking/review flow has run for this hotel yet — Features
19/24 aren't built) → returns the hotel's own stored averageRating/
reviewCount as-is, with an empty breakdown/list — never written back to
hotels, purely a read-time fallback
        ↓
count > 0 → reviews.queries.ts's getRatingBreakdown (GROUP BY rating) and
findReviewsByHotel (joins user for reviewer name/avatarUrl, ORDER BY
created_at DESC, LIMIT/OFFSET by page/pageSize) run in parallel; the
average is computed from the breakdown at read time, not read off hotels
        ↓
ReviewsSection (frontend/features/reviews/) renders the breakdown + list in
HotelDetailsContent's main column, between PoliciesSection and
SimilarHotelsSection (ui-rules.md's locked section order) — a real
EmptyState ("No reviews yet") when reviewCount is 0, a "Load more" button
that accumulates subsequent pages otherwise
```

Because `hotels.averageRating`/`reviewCount` are never written by this read path, the number shown in the page header (Feature 12, reads `hotels` directly) can differ from this section's live-computed number for any hotel with real reviews, until Feature 24 ships and starts keeping `hotels` in sync on every review write (see the "Reviews — Submission" flow above and `progress-tracker.md`'s Feature 16 Architecture Decisions).

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

### Reviews — Submission (Feature 24, not yet built)

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

### Guest → Account Merge (Recent Searches, Favorites)

```
Guest performs an action scoped to the stayzy_guest_id cookie (a search, a favorite)
        ↓
User logs in or signs up — email/password or Google OAuth, both create a session
        ↓
config/auth.ts's hooks.after middleware fires on every new-session creation
(ctx.context.newSession), reads the stayzy_guest_id cookie via ctx.getCookie
        ↓
Re-points every guest-scoped row matching that session_token to the new user_id —
recent-search.service.ts's mergeGuestRecentSearches and favorite.service.ts's
mergeGuestFavorites both run here (Promise.all, independent of each other)
        ↓
ctx.setCookie clears stayzy_guest_id; the data is now fully account-scoped
```

The merge runs from this single server-side hook rather than a frontend call after login — it fires identically for email/password sign-in/up and the Google OAuth callback (which redirects straight to `/` with no custom callback page), so there's exactly one place that ever needs to know about guest→account merging. This pattern was established in Feature 10 for `recent_searches`; Feature 17 (Favorites) reuses the same hook.

`favorites.queries.ts`'s `mergeGuestFavorites` can't be the same blind `UPDATE` `recent_searches` uses, though: `favorites` has a partial unique index on `(user_id, hotel_id)`, so if the logging-in account already favorited a hotel in a prior session, a blind re-point would throw a unique-violation. The merge runs inside a transaction that first deletes any guest-scoped row whose `hotel_id` already exists under the account (the account's existing favorite wins), then re-points the rest.

### Favorites (Feature 17)

```
GET /favorites/hotel-ids (bulk, id-only) or GET /favorites (full card data)
        ↓
resolveOwner(req, res) — same util recent-searches/reviews use — resolves to
either the logged-in user_id or the stayzy_guest_id cookie (minted on first use)
        ↓
favorites.queries.ts's findFavoriteHotelIds / findFavoritesForOwner —
the latter joins hotels and adds two correlated subqueries (same "hotels"."id"-
qualification pattern as hotels.queries.ts's listHotels/findSimilarHotels):
mainImageUrl and fromPrice (MIN(room_types.base_price)::float8 — cast to float8
since raw numeric-aggregate sql fragments otherwise come back from the pg driver
as strings, unlike declared numeric(mode:"number") columns)
        ↓
Frontend: useFavoriteHotelIds() fetches the id set once per page (SearchPageContent,
HotelDetailsContent — same lifting pattern useSearchCatalogs established) and
threads favoritedIds/onToggleFavorite down as props to every HotelCard/MapView
render, so a results page with many cards fires one fetch, not one per card.
Toggling is optimistic (flips immediately, reverts on a failed response).
        ↓
POST /favorites { hotelId } / DELETE /favorites/:hotelId — addFavorite is
idempotent server-side (a unique-violation on the partial index, surfaced via
DrizzleQueryError's .cause.code — not .code itself — is caught and swallowed)
```

`/favorites` itself uses a separate hook, `useFavoritesList()` — full card data plus local-list removal on unfavorite — rather than reusing `useFavoriteHotelIds()`, since the two pages need different shapes (an id set to cross-reference vs. full cards to render and remove from directly).

### Compare Hotels (Feature 18)

Client-only selection state — no backend `compare` table, no guest/account merge concept (nothing server-side to merge):

```
CompareProvider (React Context, mounted once in app/layout.tsx) holds
ids: string[] only — no cached name/thumbnail/price — synced to
localStorage on every change, hydrated from it in a useEffect on mount
(not a lazy useState initializer, to avoid an SSR/client hydration
mismatch — see the Feature 18 Architecture Decision)
        ↓
useCompareSelection() (Context consumer): ids / isSelected / isFull /
add / remove / clear — read directly inside HotelCard, FavoritesCard,
the hotel-details header, CompareNavIcon, and the compare page/tray,
not threaded as props (unlike Favorites' fetch-backed hook, Context
reads have no per-call fetch cost to worry about)
        ↓
Whenever ids changes, useCompareHotels(ids) — shared by CompareTray and
the /compare table — fetches fresh from:
GET /hotels/compare?ids=a,b,c
        ↓
hotels.queries.ts's findHotelsForCompare: published-only, re-sorted in
hotel.service.ts's getHotelsForCompare to match the requested id order
(SQL IN doesn't preserve it) — any id that's missing/unpublished/deleted
is silently dropped from the response rather than erroring, so an
already-selected hotel that gets unpublished mid-session just renders
one fewer card next fetch, not an error state
```

The `/compare` page's own "add a hotel" search box hits a second new endpoint, `GET /hotels/search-suggestions?q=&excludeIds=` (`findHotelSearchSuggestions` — `ILIKE` across `name`/`city`/`country`, published-only, always returns hotel rows rather than the destination search's mixed place/hotel suggestion shape). Both new routes are mounted in `hotels.routes.ts` *before* `/:id`, since Express would otherwise match `/hotels/compare` and `/hotels/search-suggestions` as `:id` = `"compare"`/`"search-suggestions"`.

Selection is capped at 4 hotels client-side (`CompareProvider`'s `MAX_COMPARE_HOTELS`); the backend's own `ids` cap (10, in `compare.schemas.ts`) is a separate, more generous sanity limit on the query itself, not the product-facing rule.

### Booking Creation (Feature 19)

This feature made room availability booking-aware everywhere, not just at insert time — every prior read path (`/search`'s `findQualifyingRoomTypes`, room selection's `resolveRoomTypeAvailability`) had only ever subtracted rate-override closures, never real bookings, because `bookings` didn't exist until this feature:

```
search.queries.ts's findOverlappingBookings(roomTypeIds, checkIn, checkOut,
heldStatuses) — overlap-date SQL (existing.check_in < requested.checkOut
AND existing.check_out > requested.checkIn), heldStatuses =
HELD_BOOKING_STATUSES (pending_payment/confirmed/completed — cancelled/
failed release their hold)
        ↓
availability.service.ts's buildBookedCountsByRoomType expands each
overlapping booking across its own night list and sums roomsBooked per
(roomTypeId, date) — same shape as the existing rate-override map
        ↓
Subtracted from effective inventory in BOTH findQualifyingRoomTypes
(search, Feature 09) and resolveRoomTypeAvailability (room selection,
Feature 13) — one overlap-date implementation, three call sites (the third
being this feature's own insert-time re-check below)
```

The actual creation flow:

```
RoomTypeCard's Reserve button → useReserveRoom.ts's reserve() (shared with
RoomSelectionSection's autoReserve effect below, so the two entry points
into booking creation can't drift):
  - no session → router.push to /login?returnTo=/hotels/[id]?...&autoReserve=1
    (reuses LoginForm's existing returnTo handling)
  - session but emailVerified: false → router.push("/verify-email") directly,
    no /login loop
  - verified session → useCreateBooking.ts POSTs to /bookings
        ↓
POST /bookings (requireAuth + validateRequest(createBookingSchema)) →
bookings.controller.ts's createBooking — 403 { error: "email_not_verified" }
if req.user.emailVerified is false (distinct from 401 for no session)
        ↓
booking.service.ts's createBookingForUser wraps the whole re-check + insert
in one db.transaction: booking.queries.ts's lockRoomTypeForBooking SELECTs
the room_types row .for("update") first, so a second concurrent Reserve on
the same room type blocks until this transaction commits rather than
racing off stale availability
        ↓
Inside the lock: capacity check (maxAdults/maxKids), hotelId/roomTypeId
match check, then the same findRateOverridesForRoomTypes +
findOverlappingBookings + resolveRoomTypeAvailability call used by search/
room-selection — both queries take an optional executor param (defaulting
to db) so they can run against this transaction's tx handle without
duplicating their SQL. remainingInventory < rooms throws a 400 (tagged via
a small badRequest() helper so errorHandler.ts doesn't log a routine
sold-out case as a 500)
        ↓
totalPrice computed server-side (avgNightlyPrice × nights × rooms) — never
trusted from the client — booking inserted as pending_payment
        ↓
Frontend routes to /checkout/[bookingId] on success
```

The logged-out round trip completes automatically rather than needing a second manual click: `RoomSelectionSection`'s `autoReserve` effect fires once, only when a real, verified session is positively confirmed (`authClient.useSession()`) — if the session can't be confirmed yet, it silently no-ops rather than risking a redirect loop back through `/login`, and the user just clicks Reserve again.

`/checkout/[bookingId]` (`app/checkout/[bookingId]/page.tsx`) is the first real page-level auth guard in the app — a thin `async` Server Component calling `getServerSession()` and `redirect()`-ing to `/login` if logged out — rendering `CheckoutPageContent`, which fetches `GET /bookings/:id` (owner-scoped via `booking.queries.ts`'s `findBookingSummaryByIdForOwner`) client-side and renders `ui-rules.md`'s Checkout Layout: a real `BookingSummaryCard` in the right rail, and a disabled "Pay Now" / "Stripe checkout is coming soon" placeholder in the main column — Feature 21 replaces only that placeholder with real Stripe Elements.

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

### AI Summary (Feature 38 built; 39 not yet)

```
Page requests the summary → GET /ai/hotels/:id/summary (backend, PUBLIC, IP rate-limited)
        ↓
backend computes content_hash over the same fields it is about to send
        ↓
hash matches hotel_ai_summaries row? → return cached summary, no LLM call
        ↓ (miss)
backend POSTs hotel context to agent/ POST /summary/hotel, with x-internal-secret
        ↓
agent/ runs the summary chain (fast model) → returns {summary, model}
        ↓
backend upserts hotel_ai_summaries with the new hash, returns the summary
        ↓ (failure, timeout, or empty content)
returns {summary: null}, writes nothing — the frontend section hides
```

The route is public because the hotel page is. `pnpm seed:ai-summaries` warms every published hotel up front, so the synchronous generation path is normally only reached for a new or just-edited hotel.

Compare summaries follow the same path against `compare_ai_summaries`, keyed by a hash of the selected hotel ids and invalidated by TTL rather than content.

### Smart Search (Features 40–42, not yet built)

```
User types a natural-language query in the search sidebar
        ↓
POST /ai/search/extract (backend) → agent/ query-extraction chain
        ↓
Chain returns structured filters matching search.schemas.ts's existing params
        ↓
frontend renders them as editable chips and writes them into the URL
        ↓
Normal search runs — the existing URL-driven pipeline, unchanged
```

The AI never queries hotels itself. It produces filters; the existing search path does the rest. A "near this hotel/place" query resolves to a reference point and hits `GET /hotels/nearby` (`ST_DWithin`) instead of a city match.

### Chat (Features 43–48, not yet built)

```
User sends a message
        ↓
POST /ai/chat (backend) — session-authed, mints the internal service secret
        ↓
backend opens the upstream request to agent/ and pipes the SSE body straight through
        ↓  (backend does not parse, buffer, or interpret the stream)
agent/ graph runs; streams token / tool_start / tool_end / action / interrupt / done events
        ↓
frontend's useChatStream reduces events into message state
        ↓
On graph completion, agent/ POSTs the finished turn to /internal/chat/messages
```

Persistence is deliberately **not** coupled to the stream — if the user closes the tab mid-reply, the stream dies but the message still lands.

Two stores hold the conversation, with an explicit winner: `chat_messages` is the source of truth for **display**; the checkpointer is the source of truth for **execution** (tool results, interrupt state, graph position). On load, a mismatch is logged as a warning and `chat_messages` wins — never thrown. See `ai-phase-plan.md` for why.

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

### `hotel_ai_summaries` (Feature 38)

| Column        | Type        | Notes                                                                    |
| ------------- | ----------- | ------------------------------------------------------------------------ |
| id            | uuid        |                                                                            |
| hotel_id      | uuid        | unique — one cached summary per hotel, FK to hotels, CASCADE               |
| content_hash  | text        | name + description + city + country + star_rating + amenities + average_rating + review_count |
| summary       | text        |                                                                            |
| model_version | text        | informational only — **not** part of the cache check                       |
| generated_at  | timestamptz |                                                                            |

A hash miss regenerates. A new review changes the hash (`review.service.ts` recomputes `average_rating`/`review_count` on every write); editing a typo inside one review body does not.

`model_version` records which model wrote the row but is deliberately **not** compared. Comparing it would force `backend/` to know `agent/`'s configured model, duplicating config across the service boundary. A model or prompt change is rolled out with `pnpm seed:ai-summaries --force` instead.

### `compare_ai_summaries` (Feature 39, not yet built)

| Column          | Type        | Notes                                       |
| --------------- | ----------- | --------------------------------------------- |
| id              | uuid        |                                                |
| hotel_ids_hash  | text        | unique — hash of the sorted selected hotel ids |
| summary         | text        |                                                |
| generated_at    | timestamptz | TTL-based invalidation, not content-based      |

### `chat_sessions` (Feature 44, not yet built)

| Column          | Type        | Notes                                                              |
| --------------- | ----------- | -------------------------------------------------------------------- |
| id              | uuid        | doubles as the LangGraph `thread_id`                                  |
| user_id         | text        | FK to `user` — chat is logged-in only, no guest duality               |
| feature         | text        | `widget` \| `chatbot`, CHECK-constrained                              |
| title           | text        |                                                                       |
| created_at      | timestamptz |                                                                       |
| last_message_at | timestamptz |                                                                       |
| ended_at        | timestamptz | nullable — a `widget` row with `ended_at IS NULL` is the active one   |

The widget has at most one active session per user, resumed on open and closed only by an explicit "New chat". The chatbot has many, browsable in a list.

### `chat_messages` (Feature 44, not yet built)

| Column          | Type        | Notes                                            |
| --------------- | ----------- | -------------------------------------------------- |
| id              | uuid        |                                                     |
| session_id      | uuid        | FK to `chat_sessions`, CASCADE                      |
| role            | text        | `user` \| `assistant`, CHECK-constrained            |
| content         | text        |                                                     |
| tool_calls_json | jsonb       | nullable — what the assistant invoked for this turn |
| created_at      | timestamptz |                                                     |

This is the display source of truth. The LangGraph checkpointer holds the same messages as execution state, in its own schema, and loses on mismatch.

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

PostGIS covers all map and nearby needs, including the AI phase's. The vector database originally scoped for AI nearby search was dropped on 2026-07-19 — `ST_DWithin` plus LLM query extraction does the job without a new dependency. Feature 42 generalizes `findSimilarHotels`'s existing city-equality filter into a real radius filter.

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

### AI phase (Features 36+)

- Neither frontend ever calls `agent/` directly — every AI feature is a `backend/` route that internally calls `agent/`. `agent/` never sees a user session cookie.
- `agent/` never writes to a product table. Every mutation goes through `backend/src/routes/internal/*`, which are thin wrappers around existing services and contain no new business logic.
- `backend/src/routes/internal/*` is reachable only with the internal service secret. A **user-scoped** internal route additionally requires an explicit acting user id and rejects the call without one — it never infers the user from a session. Not every internal route is user-scoped (hotel summary generation is not), so `requireInternalService` enforces the secret always and the acting user never; the route owns that check. Implemented in Feature 37; `GET /internal/bookings` is the reference.
- **Every inbound route that reaches `agent/` carries a rate limit.** That is the mount that bounds OpenRouter spend — `internal/*` is `agent/`→`backend/`, costs nothing, and limiting it throttles a chatbot turn's tool loop while leaving summary generation unbounded. `middlewares/rateLimit.ts` is the reusable piece; a feature that adds an AI route and no limiter has not finished.
- **A limiter keys on the acting user when the route is authenticated, and on IP when it is public.** These are opposites and both are deliberate. `internalRateLimit` must not key on IP: all internal traffic comes from the one `agent/` process, so an IP key collapses every user into one bucket. `aiRateLimit` cannot key on a user: the hotel page is public, so there is no user to key on. Anyone reading one after the other will assume the second is a bug; it is not.
- **`trust proxy` is unset, and that is a Phase 16 decision, not an oversight.** IP keying only works if Express sees the real client address. Behind a load balancer it does not, and every visitor shares one bucket. Setting `trust proxy` without knowing the deployment topology is strictly worse — it makes `X-Forwarded-For` forgeable and the limiter bypassable by anyone who sends a header. Revisit when the host is chosen.
- **A cached AI feature is bounded by its cache, not by its limiter.** A hotel summary is generated once per content change no matter how many people load the page; the limiter only stops someone forcing many *distinct* generations. Size limits against that threat, not against traffic.
- **Whatever is sent to the model must be inside the cache key.** `services/ai.service.ts` builds its content hash and its request payload from the same field list. A field the model sees but the hash ignores pins a stale answer until something else happens to change.
- **A failed or empty generation is never cached.** The configured model reasons before answering and returns empty content when its token budget runs out mid-thought, so an empty string is a failure, not a short answer. Caching it would pin a blank result until the source content changed. The user-facing section hides instead of showing an error.
- The chat widget is wired to read-only tools only. No booking, cancel, favorite, or review tool is ever exposed to it — mutations exist exclusively at `/assistant`.
- The chatbot never collects payment. A money-moving action stops at a `pending_payment` booking and hands back a `/checkout/[bookingId]` link; Stripe Elements remains the only payment surface, and a booking still confirms only via webhook.
- The AI never invents prices, availability, or hotel facts — every such value comes from a real-time tool call against `backend/`.
- `chat_messages` is the display source of truth; the LangGraph checkpointer is the execution source of truth. A mismatch is logged and `chat_messages` wins — never thrown.
- `backend/` streams by piping `agent/`'s SSE body through untouched. It never parses, buffers, or interprets the stream.
- `agent/`'s only database footprint is the LangGraph checkpointer, in its own schema, created by the library's `.setup()` — never Alembic, never a hand-rolled migration.
- The AI produces search *filters*, never search *results* — extracted filters flow into the existing URL-driven search pipeline unchanged.
