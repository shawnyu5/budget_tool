-- notification_subscription.expiration_time should be usize
BEGIN;
ALTER TABLE notification_subscription
ALTER COLUMN expiration_time TYPE BIGINT
USING EXTRACT(EPOCH FROM expiration_time)::BIGINT;
COMMIT;
