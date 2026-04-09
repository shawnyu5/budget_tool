-- Convert all date columns to use TIMESTAMPZ instead of DATE
-- We want the UTC time, instead of just the date
BEGIN;

ALTER TABLE transactions
   ALTER COLUMN date TYPE TIMESTAMPTZ
   USING (date::TIMESTAMP AT TIME ZONE 'America/New_York');

ALTER TABLE transactions
  ALTER COLUMN date SET NOT NULL;

COMMIT;
