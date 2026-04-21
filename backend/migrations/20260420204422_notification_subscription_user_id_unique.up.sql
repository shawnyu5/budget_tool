-- Add a constraint to ensure user ID is unique in notification_subscription table
BEGIN;
ALTER TABLE notification_subscription
ADD CONSTRAINT unique_use_id UNIQUE(user_id);
COMMIT;
