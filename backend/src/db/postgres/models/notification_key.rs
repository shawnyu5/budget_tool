use sqlx::prelude::FromRow;
use uuid::Uuid;

#[derive(Debug, FromRow)]
pub struct NotificationKeys {
    pub id: Uuid,
    pub user_id: Uuid,
    pub auth: String,
    pub p256dh: String,
}
