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
    /// How a transaction is split between Shawn and Maggie
    pub split_mode: Option<SplitMode>,
}

/// Determines how a transaction is split between Shawn and Maggie
#[derive(Debug, sqlx::Type, async_graphql::Enum, Copy, Clone, Eq, PartialEq, PartialOrd)]
#[sqlx(type_name = "text", rename_all = "snake_case")]
pub enum SplitMode {
    /// Use the current month settings to calculate split
    FromSettings,
    /// Split 50/50
    Evenly,
}
