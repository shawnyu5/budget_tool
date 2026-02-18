BEGIN;

-- 1. Add new numeric month column
ALTER TABLE months
ADD COLUMN month INT NOT NULL;

-- 2. Convert existing month_name into a numeric month
--    This uses a CASE statement to map names → numbers
UPDATE months
SET month = CASE
    WHEN LOWER(month_name) = 'january'   THEN 1
    WHEN LOWER(month_name) = 'february'  THEN 2
    WHEN LOWER(month_name) = 'march'     THEN 3
    WHEN LOWER(month_name) = 'april'     THEN 4
    WHEN LOWER(month_name) = 'may'       THEN 5
    WHEN LOWER(month_name) = 'june'      THEN 6
    WHEN LOWER(month_name) = 'july'      THEN 7
    WHEN LOWER(month_name) = 'august'    THEN 8
    WHEN LOWER(month_name) = 'september' THEN 9
    WHEN LOWER(month_name) = 'october'   THEN 10
    WHEN LOWER(month_name) = 'november'  THEN 11
    WHEN LOWER(month_name) = 'december'  THEN 12
    ELSE NULL
END;

-- 4. Drop old month_name column
ALTER TABLE months
DROP COLUMN month_name;

-- 5. Drop derived columns
ALTER TABLE months
DROP COLUMN total_spending,
DROP COLUMN over_budget_amount;

-- 6. Add unique constraint for (year, month)
ALTER TABLE months
ADD CONSTRAINT months_year_month_unique UNIQUE (year, month);

COMMIT;

