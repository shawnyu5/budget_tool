-- Replace year_id with just the year, since the year can be used as the unique identifier
LOCK TABLE months IN ACCESS EXCLUSIVE MODE NOWAIT;
ALTER TABLE months
DROP COLUMN year_id;

ALTER TABLE months
ADD COLUMN year INT NOT NULL DEFAULT 2026;
