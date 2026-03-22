-- Add a keys column to notification_subscription table
BEGIN;
ALTER TABLE notification_subscription
ADD COLUMN keys Json;
COMMIT;
