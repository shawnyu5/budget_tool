use rust_decimal::Decimal;
use sqlx::prelude::FromRow;
use uuid::Uuid;

/// Budget allocations for a specific month
#[derive(Debug, FromRow)]
pub struct BudgetAllocation {
    pub id: Uuid,
    pub month_id: Uuid,
    /// Name of the contributor
    pub contributor_name: String,
    /// Percentage allocation for this month
    pub percentage_allocation: Decimal,
    /// Contribution amount for this month
    pub contribution_amount: Decimal,
}
