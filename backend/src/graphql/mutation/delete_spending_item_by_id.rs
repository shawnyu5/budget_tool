use crate::graphql::mutation::MonthlyBudgetResponse;
use crate::{db::MongoDB, month::Month, routes::MaybeJwt};
use anyhow::Context as AnhowContext;
use anyhow::Result;
use async_graphql::{Context, InputObject};
use tracing::{info, instrument};

#[derive(InputObject)]
pub struct DeleteSpendingItemByIdInput {
    pub year: i32,
    pub month: Month,
    /// The ID of the spending item to delete
    pub id: String,
}

#[instrument(skip_all)]
pub async fn delete_spending_item_by_id_handler(
    ctx: &Context<'_>,
    inputs: DeleteSpendingItemByIdInput,
) -> Result<MonthlyBudgetResponse> {
    let maybe_jwt = ctx
        .data::<MaybeJwt>()
        .expect("There should always be a JWT here!");
    if maybe_jwt.is_none() {
        panic!("JWT is invalid");
        // return MonthlyBudgetResponse::Error(GraphQLErrorObject {
        //     code: GraphQLErrorCode::Forbidden,
        //     message: "Missing or invalid JWT".to_string(),
        // });
    }

    let db = MongoDB::new(&inputs.year.to_string())
        .await
        .context("Failed to connect to DB")?;

    let mut month_budget = db
        .get_month_budget(inputs.month)
        .await
        .context("Failed to get month budget")?;

    month_budget.spending.retain(|item| item.id != inputs.id);
    month_budget.update_calculations();
    info!("Updated budget: {:#?}", month_budget);
    db.update_monthly_budget(inputs.month, &month_budget)
        .await
        .context("Failed to save updated budget to DB")?;

    return Ok(MonthlyBudgetResponse::MonthlyBudget(month_budget));
}
