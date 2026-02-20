-- Months.month key had an incorrect unique constrain, where the month column must be unique in the table, this meant year = 2025, month = January, and year = 2026 and month = January is not allowed due to the unique constraint

BEGIN;

ALTER TABLE months DROP CONSTRAINT months_month_key;
ALTER TABLE months ADD CONSTRAINT unique_month_year UNIQUE (year, month);

COMMIT;

