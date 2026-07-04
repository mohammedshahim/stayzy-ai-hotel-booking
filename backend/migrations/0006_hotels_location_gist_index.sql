CREATE INDEX hotels_location_gist_idx ON hotels USING GIST (location);
