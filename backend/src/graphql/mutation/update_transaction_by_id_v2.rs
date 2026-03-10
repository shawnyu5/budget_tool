use anyhow::{Context as _, Result};
use async_graphql::{InputObject, SimpleObject};
use chrono::DateTime;
use rust_decimal::Decimal;
use uuid::Uuid;

use crate::db::postgres::PostgresDB;

#[derive(InputObject)]
pub struct UpdateTransactionByIdV2Input {
    pub transaction_id: Uuid,
    pub amount: Decimal,
    pub date: DateTime<chrono::FixedOffset>,
    pub description: Option<String>,
    pub notes: Option<String>,
}

#[derive(SimpleObject)]
pub struct UpdateTransactionByIdV2Response {
    pub success: bool,
}

pub async fn update_transaction_by_id_v2(
    inputs: UpdateTransactionByIdV2Input,
) -> Result<UpdateTransactionByIdV2Response> {
    let db = PostgresDB::new().await;
    db.update_transaction_by_id(
        inputs.transaction_id,
        inputs.amount,
        inputs.date,
        inputs.description,
        inputs.notes,
    )
    .await
    .context("Failed to update transaction in DB")?;

    return Ok(UpdateTransactionByIdV2Response { success: true });
}
