-- Re create notification subscription table
-- Previous table design was terrible
BEGIN;
DROP TABLE notification_subscription;

CREATE TABLE notification_subscription (
   id UUID PRIMARY KEY,
   user_id UUID NOT NULL,
   endpoint TEXT NOT NULL,
   -- There may not always be an expiration time
   expiration_time TEXT,
   p256dh TEXT NOT NULL,
   auth TEXT NOT NULL,

   CONSTRAINT fk_user_id
      FOREIGN KEY(user_id)
      REFERENCES "users"(id)
);
COMMIT;
