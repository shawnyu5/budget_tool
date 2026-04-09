use sqlx::prelude::FromRow;
use uuid::Uuid;

#[derive(Debug, FromRow)]
pub struct NotificationKeyRow {
    pub id: Uuid,
    pub user_id: Uuid,
    pub auth: String,
    pub p256dh: String,
}
