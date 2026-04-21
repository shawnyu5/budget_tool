-- Add a constraint to ensure user ID is unique in notification_subscription table
BEGIN;
ALTER TABLE notification_subscription
DROP CONSTRAINT unique_user_id;
COMMIT;
