CREATE TABLE favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  session_token text,
  hotel_id uuid NOT NULL REFERENCES hotels (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (user_id IS NOT NULL AND session_token IS NULL) OR
    (user_id IS NULL AND session_token IS NOT NULL)
  )
);

CREATE UNIQUE INDEX favorites_user_hotel_idx ON favorites (user_id, hotel_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX favorites_session_hotel_idx ON favorites (session_token, hotel_id) WHERE session_token IS NOT NULL;

CREATE TABLE recent_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  session_token text,
  destination_query text NOT NULL,
  check_in date NOT NULL,
  check_out date NOT NULL,
  adults integer NOT NULL,
  kids integer NOT NULL DEFAULT 0,
  rooms integer NOT NULL DEFAULT 1,
  searched_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (user_id IS NOT NULL AND session_token IS NULL) OR
    (user_id IS NULL AND session_token IS NOT NULL)
  )
);
