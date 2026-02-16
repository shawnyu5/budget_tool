use anyhow::{Context, Result};
use async_graphql::{Enum, InputObject, Union};
use chrono::Local;
use mongodb::bson::doc;
use rayon::iter::{IntoParallelRefIterator, ParallelIterator};
use serde::Serialize;
use thiserror::Error;
use tracing::{info, warn};

use crate::{
    db::DB,
    graphql::error::GraphQlErrorObjectV2,
    month::Month,
    monthly_budget::{MonthlyBudget, SpendingItem},
};

#[derive(InputObject)]
pub struct SearchSpendingItemInput {
    year: u16,
    month: Month,
    id: String,
}

#[derive(Enum, Copy, Clone, Eq, PartialEq, Debug, Error, Serialize)]
pub enum SearchSpendingItemError {
    /// Transaction not found. This is most likey a bug...
    #[error("Transaction not found")]
    NotFound,
}

#[derive(Union)]
pub enum SearchSpendingItemResponse {
    SpendingItem(SpendingItem),
    GraphQLErrorObject(GraphQlErrorObjectV2<SearchSpendingItemError>),
}

pub async fn search_spending_item_handler(
    inputs: SearchSpendingItemInput,
) -> Result<Option<SpendingItem>> {
    let db = DB::<MonthlyBudget>::new(&inputs.year.to_string())
        .await
        .context("Failed to connect to database")?;

    let filter = doc! {
        "month": inputs.month.to_string(),
        "spending": {
            "$elemMatch": {
                "id": inputs.id.clone(),
            }
        }
    };

    info!("Looking up spending item");
    let found = db
        .collection
        .find_one(filter)
        .await
        .context("Failed to look for spending item")?;

    if let Some(monthly_budget) = found {
        let spending_items: Vec<&SpendingItem> = monthly_budget
            .spending
            .par_iter()
            .filter(|spending| spending.id == inputs.id)
            .collect();
        debug_assert!(
            spending_items.len() == 1,
            "More than 1 spending items found. This should never happen. We are searching by ID"
        );

        // TODO: this should not be needed
        let mut spending_item = spending_items[0].clone();
        if spending_item.id.is_empty() {
            warn!("Spending item ID is empty, adding ID");
            spending_item.id = Local::now().to_string()
        }

        return Ok(Some(spending_items[0].clone()));
    }
    info!("Filter matched no spending records");
    return Ok(None);
}
