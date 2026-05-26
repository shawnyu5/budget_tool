use anyhow::{Context as _, Result};
use async_graphql::{Context, InputObject, SimpleObject};

use crate::graphql::utils::extract_db_client;

#[derive(InputObject, Debug)]
pub struct GetTransactionDescriptionsInput {
    /// Filter by description that contains this string
    // TODO: explore using Postgres pg_trgm extension
    // Current implementation uses rust to filter for now
    contains: Option<String>,
    /// The number of results to return
    limit: i64,
}

#[derive(SimpleObject)]
pub struct GetTransactionDescriptionsResponse {
    descriptions: Vec<String>,
}

pub async fn get_transaction_descriptions(
    ctx: &Context<'_>,
    inputs: GetTransactionDescriptionsInput,
) -> Result<GetTransactionDescriptionsResponse> {
    let db = extract_db_client(ctx);
    let mut tx = db.transaction().await?;
    let transactions = db
        .get_transactions_descriptions(&mut tx, inputs.limit)
        .await
        .context("Failed to get transactions from DB")?
        .into_iter()
        .filter(|desc| desc.contains(&inputs.contains.clone().unwrap_or_default()))
        .collect();

    Ok(GetTransactionDescriptionsResponse {
        descriptions: transactions,
    })
}
