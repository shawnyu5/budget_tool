use anyhow::Context as _;
use anyhow::Result;
use async_graphql::Context;
use async_graphql::{InputObject, SimpleObject};
use uuid::Uuid;

use crate::graphql::utils::extract_db_client;
use crate::models::Transaction;

#[derive(InputObject)]
pub struct SearchTransactionV2Inputs {
    /// ID of the transaction to search for
    pub transaction_id: Uuid,
}

#[derive(SimpleObject)]
pub struct SearchTransactionV2Response {
    pub transaction: Option<Transaction>,
}

pub async fn search_transaction_v2(
    ctx: &Context<'_>,
    inputs: SearchTransactionV2Inputs,
) -> Result<SearchTransactionV2Response> {
    let db = extract_db_client(ctx);
    let transaction = db
        .get_transaction_by_id(inputs.transaction_id)
        .await
        .context("Failed to query transaction by ID")?;

    match transaction {
        Some(t) => {
            return Ok(SearchTransactionV2Response {
                transaction: Some(Transaction {
                    id: t.id,
                    amount: t.amount,
                    date: t.date,
                    description: t.description.unwrap_or_default(),
                    notes: t.notes.unwrap_or_default(),
                }),
            });
        }
        None => return Ok(SearchTransactionV2Response { transaction: None }),
    }
}
