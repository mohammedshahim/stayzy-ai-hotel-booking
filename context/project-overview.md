# Stayzy

## Overview

A full stack hotel booking platform. Users search hotels by destination, dates, and guest count, compare and shortlist properties, book a room, and pay online through Stripe. Hotel inventory, rooms, pricing, and bookings are managed by staff through a dedicated admin panel.

AI-assisted search, comparison summaries, and a booking chatbot are planned for a later phase and are explicitly out of scope for the initial build.

---

## Problem It Will Solve

Booking a hotel today means juggling multiple tabs to compare prices, amenities, and reviews across properties. Stayzy consolidates search, side-by-side comparison, and checkout into one flow, so a traveler can go from "where am I going" to a confirmed, paid booking without leaving the product.

For the business side, the admin panel gives hotel operations staff a single place to manage property listings, room inventory, pricing, and incoming bookings — no manual spreadsheet or email-based booking management.

---

## Pages

### User Frontend (Next.js)

```
/                              → Homepage
/search                        → Search results (hotel listing)
/hotels/[id]                   → Hotel details
/favorites                     → Favorites
/compare                       → Compare hotels
/login                         → Login
/signup                        → Sign up
/verify-email                  → Email verification notice / handler
/checkout/[bookingId]          → Booking checkout + Stripe payment
/booking-confirmation/[bookingId] → Post-payment confirmation
/bookings                      → My bookings (list)
/bookings/[id]                 → Booking details, manage, cancel
/bookings/[id]/review          → Leave/edit a review for a completed stay
/profile                       → Account details
```

### Admin Frontend (React + Vite)

```
/login                         → Admin login
/dashboard                     → Analytics + overview
/hotels                        → Hotel list (CRUD entry point)
/hotels/new                    → Create hotel
/hotels/[id]                   → Edit hotel, manage rooms, amenities, images
/bookings                      → Booking list (confirm / cancel / modify)
/bookings/[id]                 → Booking detail + allocation
```

---

## Navigation

**User frontend** — fixed top navbar: logo, search entry point (compact search bar once past the homepage), Favorites icon, Compare icon (badge shows selected count), account menu (Login/Sign up when logged out; avatar with My Bookings / Profile / Logout when logged in). Footer on public/marketing pages with company info, support links, and legal links.

A floating compare tray appears at the bottom of the viewport, app-wide, whenever at least one hotel is added to compare (see Compare Hotels below). It persists across navigation until cleared or the user proceeds to `/compare`.

**Admin frontend** — sidebar navigation: Dashboard, Hotels, Bookings. No public-facing pages; every route requires an authenticated admin session.

---

## Core User Flow

### Homepage

- Navbar with login/account state
- Search widget: destination (place/location/free text with autocomplete), check-in/check-out date range, guests and rooms breakdown (Adults, Kids, Rooms)
- Recent searches — stored in browser storage for guests, stored per-user server-side once logged in
- Search-while-typing suggestions (place names, previously searched destinations)
- Trending destinations section — destinations ranked by recent booking volume
- Footer

### Search Hotels (`/search`)

- Sticky sidebar filters: price range, star rating, guest rating, amenities/facilities, room features, meals included, free cancellation, landmarks/points of interest, "things to do nearby"
- Smart/free-text search box in the filter sidebar (reserved for AI-assisted search in a later phase — plain keyword match for now)
- Sort control (separate from filters): Recommended (default), Price low to high, Price high to low, Guest rating, Star rating, Distance from city center
- Active filters shown as removable chips above the results
- List / Grid / Map view toggle — Map view splits the screen into a scrollable results list and an interactive map with a pin per hotel; hovering or selecting a card highlights its pin and vice versa
- Hotel card shows: main image, hotel name, star rating, guest rating + review count, location and distance from city center or a reference landmark (with a small map-pin indicator that syncs to Map view), available room type, price for the selected dates, discount badge (if any), key amenities, Favorite toggle, Compare toggle, "See availability" / View Details action
- Pagination (offset-based, page-numbered)
- Empty state with relaxed-filter suggestions when no results match

### Hotel Details (`/hotels/[id]`)

- Image gallery: one designated main image plus a supporting grid/carousel of additional images
- Full hotel description, amenities, policies (check-in/out times, cancellation policy)
- Map showing the hotel's location (PostGIS-backed coordinates)
- Available room types for the selected dates with per-room pricing, remaining inventory, and a "Reserve" action per room
- Reviews section: average rating breakdown plus individual written reviews
- Favorite and Compare actions
- Similar hotels section below the fold — same destination, overlapping price band or star rating, ranked by proximity (PostGIS `ST_DWithin`) and rating; excludes the hotel currently being viewed
- AI summary placeholder slot reserved for the later AI phase (not rendered until then)
- Skeleton loading for gallery, room list, and reviews while data loads

### Favorites (`/favorites`)

- Guests can favorite hotels; the selection is stored against an anonymous session cookie
- On login or signup, cookie-based favorites are merged into the user's account and the cookie is cleared
- Once logged in, favorites are stored server-side against the user and available across devices
- Favorites are rendered with a visually distinct card (more compact, dated "Saved on ...") from the search results card, so the page is unmistakably the favorites view
- Users can remove favorites directly from this page

### Compare Hotels (`/compare`)

- Hotels can be added to compare from the search results page, favorites page, or the hotel details page
- Adding a hotel to compare shows a floating bottom tray with the selected hotels (thumbnail + name) and a "Compare" button; the tray is dismissible and persists via client-side state (rehydrated from local storage) as the user keeps browsing
- Users can also open `/compare` directly and add hotels from a search box on that page
- Comparison table shows: image, name, star/guest rating, price for selected dates, key amenities, distance from a reference point, cancellation policy
- Only the first two hotels are shown side by side by default; from the third hotel onward, the table scrolls horizontally so the layout doesn't get cramped
- An AI summary section is reserved at the bottom of the compare table for the later AI phase

### Book, Checkout, Payment, My Bookings

- Reserving a room requires an authenticated session; anonymous users are redirected to `/login` with a return path back to checkout
- Checkout (`/checkout/[bookingId]`) shows a booking summary (hotel, room type, dates, guest count, price breakdown) and collects payment through Stripe
- A booking row is created in a `pending_payment` state before payment is collected, and a Stripe PaymentIntent is created against it; the booking only moves to `confirmed` after a webhook confirms successful payment (never on client-side redirect alone)
- `/bookings` lists the user's bookings with status (pending, confirmed, cancelled, completed) and lets the user open any booking
- `/bookings/[id]` shows full booking details, a cancellation action (subject to the hotel's free-cancellation policy and cutoff), and — once the stay is completed — a link to leave a review

### Reviews

- A review can only be created against a booking that belongs to the user and has reached `completed` status (checkout date has passed and the stay wasn't cancelled)
- A review is a star rating (1–5) plus a text description
- Users can edit or delete their own review at any time from `/bookings/[id]/review`
- A hotel's aggregate rating and review count shown on search cards and the hotel details page are recalculated whenever a review is created, edited, or deleted

### Login / Sign Up

- Email + password, or Google OAuth, via better-auth
- Email/password sign-up sends a verification email; the account is usable immediately but flagged unverified until confirmed (verification is required before completing a booking)
- Google sign-up pulls name, email, and avatar from the Google profile and skips email verification (already verified by Google)
- Password reset flow (request reset email, set new password) is included as a standard part of the auth surface

### Admin Panel — Manage Hotels

- Full CRUD on hotels: name, description, address (geocoded to lat/lng on save for map + nearby queries), amenities, policies, images (one marked as main)
- Room management nested under a hotel: room type, description, room features, meals included, free-cancellation flag, base price, total inventory count
- Availability/pricing overrides per date range (e.g., seasonal pricing, blackout dates) are managed at the room level

### Admin Panel — Manage Bookings

- List of all bookings across hotels with filters by status, hotel, and date range
- Confirm, cancel, or reallocate a booking (e.g., move to a different room of the same type if the original is unavailable)
- Cancelling a booking releases the held room inventory back to availability

### Admin Panel — Dashboard

- Key metrics: total bookings, revenue (from confirmed/completed bookings), occupancy rate, cancellation rate
- Recent bookings feed
- Top-performing hotels by bookings and revenue
- Upcoming check-ins/check-outs for the next few days, to surface anything needing operational attention

---

## Features In Scope

- Homepage with search widget, recent searches, search-while-typing suggestions, and trending destinations
- Search results with sidebar filters, list/grid toggle, pagination, and empty states
- Hotel details with gallery, rooms, reviews, map, and similar hotels
- Favorites with guest-cookie-to-account merge on login
- Compare hotels with a floating compare tray and a horizontally scrolling compare table
- Authenticated booking + checkout flow
- Stripe payment integration (PaymentIntents + webhooks)
- My Bookings with cancellation
- Reviews scoped to completed bookings, editable/removable by their author
- Email + Google OAuth authentication with email verification and password reset
- Admin hotel CRUD (hotels, rooms, pricing, availability, amenities, images)
- Admin booking management (confirm/cancel/reallocate)
- Admin analytics dashboard
- Geo-located hotels via PostGIS for map display and "similar/nearby hotels" queries
- Skeleton loading states across data-dependent views

---

## Features Out of Scope (Phase 1)

Deferred to the AI phase, once the core booking product is stable:

- AI chat widget
- AI-generated hotel summaries (hotel details + compare page)
- Chatbot able to perform booking operations end-to-end
- Stripe payment initiated from within the AI chat interface
- Vector-database-backed nearby-hotel search assisted by AI

Not planned at all for this product:

- Multi-currency / multi-language support
- Native mobile apps
- Property-owner self-service onboarding (hotels are onboarded by internal admin staff only)

---

## Success Criteria

- A guest can search a destination, filter results, and view hotel details without creating an account
- A user can complete search → room selection → Stripe payment → confirmed booking without errors
- Booking confirmation is only ever granted after a verified Stripe webhook event, never from client-side state alone
- Favorites and recent searches persist correctly across a guest session and correctly merge into the account on login
- Compare supports 2+ hotels with a usable layout at 3 or more selections
- A completed booking becomes reviewable, and the hotel's aggregate rating updates immediately after the review is submitted
- Admin staff can create a bookable hotel (with rooms, pricing, images) end to end without engineering help
- Admin dashboard reflects real booking and revenue data with no manual reconciliation

---

## Target User

**Traveler (user frontend)** — a leisure or business traveler comparing multiple hotels for a trip, price- and amenity-conscious, expects the search-to-booking flow to feel as fast and trustworthy as major booking sites.

**Hotel operations staff (admin frontend)** — internal staff responsible for keeping hotel listings, room inventory, and pricing accurate, and for handling booking confirmations, cancellations, and reallocations as they come in.
