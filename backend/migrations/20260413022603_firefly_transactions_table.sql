-- Create firefly_transactions table
BEGIN;
CREATE TABLE firefly_transactions (
   id UUID PRIMARY KEY NOT NULL,
   transaction_id UUID REFERENCES transactions(id) NOT NULL,
   firefly_id TEXT NOT NULL,
   firefly_link TEXT NOT NULL
);
COMMIT;
