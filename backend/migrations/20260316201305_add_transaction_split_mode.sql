-- Add split_mode to transaction table
BEGIN;
CREATE TYPE split_mode AS ENUM ('from_settings', 'evenly');
ALTER TABLE transactions
ADD COLUMN split_mode split_mode;
COMMIT;
