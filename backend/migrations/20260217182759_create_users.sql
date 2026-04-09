-- Add migration script here
CREATE EXTENSION IF NOT EXISTS pgcrypto;

WITH maggie AS (
   INSERT INTO users (id, username)
   VALUES (gen_random_uuid(), 'maggie')
   RETURNING id
)
INSERT INTO firefly (id, user_id)
SELECT gen_random_uuid(), id
FROM maggie;

-- Then another statement for notification_subscription
INSERT INTO notification_subscription (id, user_id)
SELECT gen_random_uuid(), id
FROM users
WHERE username = 'maggie';

WITH shawn AS (
   INSERT INTO users (id, username)
   VALUES (gen_random_uuid(), 'shawn')
   RETURNING id
)
INSERT INTO firefly (id, user_id)
SELECT gen_random_uuid(), id
FROM shawn;

INSERT INTO notification_subscription
SELECT gen_random_uuid(), id
FROM users
WHERE username = 'shawn'
