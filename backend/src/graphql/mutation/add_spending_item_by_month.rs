use crate::graphql::error::GraphQLErrorObject;
use crate::graphql::utils::extract_jwt;
use crate::monthly_budget::MonthlyBudget;
use crate::{db::DB, month::Month, monthly_budget::SpendingItem, routes::MaybeJwt};
use anyhow::Context as AnhowContext;
use anyhow::Result;
use async_graphql::Union;
use async_graphql::{Context, InputObject};
use tracing::{info, instrument};

#[derive(InputObject)]
pub struct AddSpendingItemByMonthInput {
    pub year: String,
    pub month: Month,
    pub spending_item: SpendingItem,
}

#[derive(Union)]
pub enum MonthlyBudgetResponse {
    MonthlyBudget(MonthlyBudget),
    Error(GraphQLErrorObject),
}

#[instrument(skip_all)]
pub async fn add_spending_item_by_month_handler(
    ctx: &Context<'_>,
    inputs: AddSpendingItemByMonthInput,
) -> Result<MonthlyBudgetResponse> {
    let jwt = extract_jwt(ctx)?;

    let db = DB::new(inputs.year.as_str())
        .await
        .context("Failed to connect to DB")?;

    let mut month_budget = db
        .get_month_budget(inputs.month)
        .await
        .context("Failed to get monthly budget")?;

    month_budget.spending.push(inputs.spending_item);
    month_budget.update_calculations();

    info!("Updated budget: {:#?}", month_budget);
    db.update_monthly_budget(inputs.month, &month_budget)
        .await
        .context("Failed to save updated budget to DB")?;

    return Ok(MonthlyBudgetResponse::MonthlyBudget(month_budget));
}
