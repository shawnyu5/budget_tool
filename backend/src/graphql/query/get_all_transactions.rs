use anyhow::{Context as _, Result};
use async_graphql::{Context, InputObject, SimpleObject};

use crate::{graphql::utils::extract_db_client, models::Transaction};

#[derive(InputObject, Debug)]
pub struct GetTransactionsInput {
    /// Filter by description that contains this string
    // TODO: explore using Postgres pg_trgm extension
    // Current implementation uses rust to filter for now
    contains: Option<String>,
    /// The number of results to return
    limit: i64,
}

#[derive(SimpleObject)]
pub struct GetTransactionsResponse {
    transactions: Vec<Transaction>,
}

pub async fn get_transactions(
    ctx: &Context<'_>,
    inputs: GetTransactionsInput,
) -> Result<GetTransactionsResponse> {
    let db = extract_db_client(ctx);
    let mut tx = db.transaction().await?;
    let transactions = db
        .get_transactions(&mut tx, inputs.limit)
        .await
        .context("Failed to get transactions from DB")?
        .into_iter()
        .map(Transaction::from)
        .filter(|t| {
            t.description
                .contains(&inputs.contains.clone().unwrap_or_default())
        })
        .collect();

    Ok(GetTransactionsResponse { transactions })
}
