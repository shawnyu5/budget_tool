use rust_decimal::Decimal;
use sqlx::prelude::FromRow;
use uuid::Uuid;

use crate::month::Month;

/// Stores budget information for a single month
#[derive(Debug, FromRow)]
pub struct MonthBudget {
    /// Primary key
    pub id: Uuid,
    /// The year this month is in
    pub year_id: Uuid,
    /// Name of the month
    pub month_name: Month,
    /// Total budget for this month
    pub total_allocation: Decimal,
    /// Amount over spent for this month. Default: 0
    pub over_budget_amount: Decimal,
}
