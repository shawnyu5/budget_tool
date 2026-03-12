use chrono::DateTime;
use rust_decimal::Decimal;
use sqlx::prelude::FromRow;
use uuid::Uuid;

/// A single transaction
#[derive(Debug, FromRow)]
pub struct TransactionRow {
    pub id: Uuid,
    pub month_id: Uuid,
    pub amount: Decimal,
    pub date: DateTime<chrono::FixedOffset>,
    pub description: Option<String>,
    pub notes: Option<String>,
}
