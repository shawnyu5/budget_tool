-- Remove user_id from firefly_transactions table
BEGIN;
ALTER TABLE firefly_transactions
DROP COLUMN user_id;
COMMIT;
