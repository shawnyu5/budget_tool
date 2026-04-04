use chrono::NaiveDate;
use sqlx::{prelude::FromRow, types::Json};
use uuid::Uuid;

use crate::routes::notification::NotificationKeys;

#[derive(Debug, FromRow, Clone)]
pub struct NotificationSubscriptionRow {
    pub id: Uuid,
    pub user_id: Uuid,
    /// The endpoint to send notification to
    pub endpoint: Option<String>,
    pub expiration_time: Option<i64>,
    pub keys: Option<Json<NotificationKeys>>,
}
