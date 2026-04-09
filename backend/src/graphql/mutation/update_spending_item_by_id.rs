use crate::monthly_budget::SpendingItem;
use crate::{db::MongoDB, month::Month};
use anyhow::Context as AnhowContext;
use anyhow::Result;
use async_graphql::{Context, InputObject, SimpleObject};
use chrono::NaiveDate;
use mongodb::bson::doc;
use rayon::prelude::*;
use tracing::{debug, error, info, instrument};

#[derive(InputObject)]
pub struct UpdateSpendingItemByIdInput {
    pub year: i32,
    pub month: Month,
    /// The new spending item to update
    pub spending_item: SpendingItem,
}

#[derive(SimpleObject)]
pub struct UpdateSpendingItemByIdResponse {
    pub success: bool,
}

#[instrument(skip_all)]
pub async fn update_spending_item_by_id_handler(
    _ctx: &Context<'_>,
    inputs: UpdateSpendingItemByIdInput,
) -> Result<UpdateSpendingItemByIdResponse> {
    info!("New spending item: {:#?}", inputs.spending_item);
    let db = MongoDB::new(&inputs.year.to_string())
        .await
        .context("Failed to connect to database")?;

    let mut monthly_budget = db
        .get_month_budget(inputs.month)
        .await
        .context("Failed to get budget for month {month}")?;

    // TODO: look into doing this without cloning
    info!("Looking for ID: {id}", id = inputs.spending_item.id);
    let updated_monthly_spending: Vec<SpendingItem> = monthly_budget
        .spending
        .par_iter_mut()
        .map(|spending| {
            info!("Iteration ID: {}", spending.id);
            if spending.id == inputs.spending_item.id {
                info!("Found existing item, updating");
                SpendingItem {
                    id: inputs.spending_item.id.clone(),
                    date: inputs.spending_item.date.clone(),
                    date_rfc3339: inputs.spending_item.date_rfc3339.clone(),
                    amount: inputs.spending_item.amount,
                    description: inputs.spending_item.description.clone(),
                    notes: inputs.spending_item.notes.clone(),
                }
            } else {
                spending.clone()
            }
        })
        .collect();
    monthly_budget.spending = updated_monthly_spending;
    monthly_budget.spending.sort_by(|a, b| {
        info!("Sorting spending item");
        // If we cant parse either dates into a proper date, just give up
        let fallback_date = NaiveDate::from_ymd_opt(1, 1, 1).unwrap();
        let a_date = NaiveDate::parse_from_str(&a.date, "%Y/%m/%d").unwrap_or_else(|e| {
            error!(
                "Failed to parse date: {e}. Using fallback date: {}",
                fallback_date.to_string()
            );
            fallback_date
        });

        let b_date = NaiveDate::parse_from_str(&b.date, "%Y/%m/%d").unwrap_or_else(|e| {
            error!(
                "Failed to parse date: {e}. Using fallback date: {}",
                fallback_date.to_string()
            );
            fallback_date
        });

        b_date.cmp(&a_date)
    });
    debug!("Sorted spending items: {:?}", monthly_budget.spending);

    monthly_budget.update_calculations();
    info!(
        "Calculated over budget amount: {}",
        monthly_budget.over_budget_amount
    );
    info!(
        "Calculated total spending: {}",
        monthly_budget.total_spending
    );
    debug!("Updated spending items: {:?}", monthly_budget.spending);
    debug!(
        "Calculated total spending: {}",
        monthly_budget.total_spending
    );

    let filter = doc! {
        "month": inputs.month.to_string()
    };

    let result = db
        .collection
        .replace_one(filter, &monthly_budget)
        // .with_options(options)
        .await
        .context("Failed to update monthly budget")?;

    info!("Modified {} document(s)", result.modified_count);
    debug_assert!(
        result.modified_count == 1,
        "Should always modify a single document"
    );
    return Ok(UpdateSpendingItemByIdResponse { success: true });
}
