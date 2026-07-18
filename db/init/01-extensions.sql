-- Runs automatically on FIRST initialization of an empty Postgres data volume
-- (docker-entrypoint-initdb.d). Safe to re-run manually; IF NOT EXISTS guards.
-- These extensions are required by the search/import layer:
--   unaccent  -> diacritic-insensitive matching ("usa" finds "ușă")
--   pg_trgm   -> fuzzy/typo-tolerant search (staged rollout)
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
