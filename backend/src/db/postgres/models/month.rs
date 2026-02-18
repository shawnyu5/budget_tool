use rust_decimal::Decimal;
use sqlx::prelude::FromRow;
use uuid::Uuid;

/// Stores budget information for a single month
#[derive(Debug, FromRow)]
pub struct MonthRow {
    /// Primary key
    pub id: Uuid,
    /// The year this month is in
    pub year: i32,
    /// Numeric representation of the Month
    pub month: i32,
    /// Total budget for this month
    pub total_allocation: Decimal,
}
