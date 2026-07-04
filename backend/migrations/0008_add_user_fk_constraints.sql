-- better-auth generates text ids (not uuid) for "user", so the deferred user_id
-- columns from 0002-0005 are retyped to text before the FK can be added.
ALTER TABLE bookings ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE reviews ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE favorites ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE recent_searches ALTER COLUMN user_id TYPE text USING user_id::text;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE RESTRICT;

ALTER TABLE reviews
  ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE RESTRICT;

ALTER TABLE favorites
  ADD CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE;

ALTER TABLE recent_searches
  ADD CONSTRAINT recent_searches_user_id_fkey FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE;
