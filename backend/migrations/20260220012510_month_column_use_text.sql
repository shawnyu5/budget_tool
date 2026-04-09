-- Use `Month` enum in rust to represent the Month column in the months table, instead of a number
-- This is more economical
ALTER TABLE months
DROP COLUMN month;

ALTER TABLE months
ADD COLUMN month TEXT NOT NULL UNIQUE;
