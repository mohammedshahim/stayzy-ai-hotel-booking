CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  hotel_id uuid NOT NULL REFERENCES hotels (id) ON DELETE RESTRICT,
  room_type_id uuid NOT NULL REFERENCES room_types (id) ON DELETE RESTRICT,
  check_in date NOT NULL,
  check_out date NOT NULL,
  adults integer NOT NULL,
  kids integer NOT NULL DEFAULT 0,
  rooms_booked integer NOT NULL,
  total_price numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending_payment'
    CHECK (status IN ('pending_payment', 'confirmed', 'cancelled', 'completed', 'failed')),
  stripe_payment_intent_id text,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (check_out > check_in)
);

CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL UNIQUE REFERENCES bookings (id) ON DELETE RESTRICT,
  user_id uuid NOT NULL,
  hotel_id uuid NOT NULL REFERENCES hotels (id) ON DELETE RESTRICT,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
