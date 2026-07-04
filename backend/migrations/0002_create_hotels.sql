CREATE TABLE hotels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  state text,
  country text NOT NULL,
  postal_code text,
  location geography(Point, 4326) NOT NULL,
  star_rating integer NOT NULL CHECK (star_rating BETWEEN 1 AND 5),
  check_in_time time NOT NULL,
  check_out_time time NOT NULL,
  free_cancellation boolean NOT NULL DEFAULT false,
  cancellation_policy text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  average_rating numeric NOT NULL DEFAULT 0,
  review_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE hotel_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels (id) ON DELETE CASCADE,
  url text NOT NULL,
  is_main boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX hotel_images_one_main_per_hotel_idx
  ON hotel_images (hotel_id)
  WHERE is_main = true;

CREATE TABLE amenities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  icon text NOT NULL
);

CREATE TABLE hotel_amenities (
  hotel_id uuid NOT NULL REFERENCES hotels (id) ON DELETE CASCADE,
  amenity_id uuid NOT NULL REFERENCES amenities (id) ON DELETE CASCADE,
  PRIMARY KEY (hotel_id, amenity_id)
);
