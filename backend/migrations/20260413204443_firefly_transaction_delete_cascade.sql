-- A firefly_transaction should delete when its parent transaction is deleted
BEGIN;
ALTER TABLE firefly_transactions
DROP CONSTRAINT firefly_transactions_transaction_id_fkey;

ALTER TABLE firefly_transactions
ADD CONSTRAINT firefly_transactions_transaction_id_fkey
FOREIGN KEY (transaction_id)
REFERENCES transactions (id)
ON DELETE CASCADE;
COMMIT;
