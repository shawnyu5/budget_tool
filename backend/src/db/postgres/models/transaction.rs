use chrono::DateTime;
use chrono_tz::Tz;
use rust_decimal::Decimal;
use sqlx::prelude::FromRow;
use uuid::Uuid;

/// A single transaction
#[derive(Debug, FromRow)]
pub struct TransactionRow {
    pub id: Uuid,
    pub month_id: Uuid,
    pub amount: Decimal,
    pub date: DateTime<Tz>,
    pub description: String,
    pub notes: String,
}
