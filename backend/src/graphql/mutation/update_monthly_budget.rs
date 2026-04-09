use anyhow::{Context as _, Result};
use async_graphql::{Context, InputObject};
use tracing::info;

use crate::{
    db::MongoDB, graphql::mutation::MonthlyBudgetResponse, month::Month,
    monthly_budget::MonthlyBudget,
};

#[derive(InputObject)]
pub struct UpdateMonthlyBudgetInput {
    year: u16,
    month: Month,
    budget: MonthlyBudget,
}

pub async fn update_monthly_budget_handler(
    _ctx: &Context<'_>,
    mut inputs: UpdateMonthlyBudgetInput,
) -> Result<MonthlyBudgetResponse> {
    let db = MongoDB::new(&inputs.year.to_string())
        .await
        .context("Failed to connect to database")?;
    inputs.budget.update_calculations();
    let result = db
        .update_monthly_budget(inputs.month, &inputs.budget)
        .await?;

    info!("Matched {} document(s)", result.matched_count);
    info!("Modified {} document(s)", result.modified_count);
    return Ok(MonthlyBudgetResponse::MonthlyBudget(inputs.budget));
}
