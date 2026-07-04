CREATE TABLE meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE
);

CREATE TABLE room_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels (id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL,
  max_adults integer NOT NULL,
  max_kids integer NOT NULL DEFAULT 0,
  base_price numeric NOT NULL,
  total_inventory integer NOT NULL,
  free_cancellation boolean,
  meal_plan_id uuid REFERENCES meal_plans (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE room_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE
);

CREATE TABLE room_type_features (
  room_type_id uuid NOT NULL REFERENCES room_types (id) ON DELETE CASCADE,
  room_feature_id uuid NOT NULL REFERENCES room_features (id) ON DELETE CASCADE,
  PRIMARY KEY (room_type_id, room_feature_id)
);

CREATE TABLE room_type_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_type_id uuid NOT NULL REFERENCES room_types (id) ON DELETE CASCADE,
  url text NOT NULL,
  is_main boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX room_type_images_one_main_per_room_type_idx
  ON room_type_images (room_type_id)
  WHERE is_main = true;

CREATE TABLE rate_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_type_id uuid NOT NULL REFERENCES room_types (id) ON DELETE CASCADE,
  date date NOT NULL,
  price numeric,
  available_override integer,
  UNIQUE (room_type_id, date)
);
