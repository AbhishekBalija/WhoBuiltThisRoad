CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE TABLE roads (
  id            SERIAL PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  description   TEXT,
  ward_number   INTEGER,
  ward_name     TEXT,
  division      TEXT,
  length_km     NUMERIC(6, 2),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX roads_ward_idx ON roads (ward_number);
