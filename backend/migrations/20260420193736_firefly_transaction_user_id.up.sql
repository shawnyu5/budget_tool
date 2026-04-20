-- Add user_id to firefly_transactions table
BEGIN;
ALTER TABLE firefly_transactions
ADD COLUMN user_id UUID REFERENCES users(id);

COMMENT ON COLUMN firefly_transactions.user_id IS 'The user this firefly transaction is associated with';
COMMIT;
