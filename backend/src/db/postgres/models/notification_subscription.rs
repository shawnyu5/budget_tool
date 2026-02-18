use sqlx::prelude::FromRow;
use uuid::Uuid;

#[derive(Debug, FromRow)]
pub struct NotificationSubscriptionRow {
    pub id: Uuid,
    pub user_id: Uuid,
    /// The endpoint to send notification to
    pub endpoint: String,
    pub expiration_time: String,
}
