use rust_decimal::Decimal;
use sqlx::prelude::FromRow;
use uuid::Uuid;

/// Budget allocations for a specific month
#[derive(Debug, FromRow)]
pub struct BudgetAllocationRow {
    pub id: Uuid,
    /// Month ID this contribution is for
    pub month_id: Uuid,
    /// User ID of the contributor
    pub user_id: Uuid,
    /// Percentage allocation for this month
    pub percentage_allocation: Decimal,
    /// Contribution amount for this month
    pub contribution_amount: Decimal,
}
