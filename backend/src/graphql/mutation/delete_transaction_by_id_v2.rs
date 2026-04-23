use anyhow::{Context as _, Result};
use async_graphql::{InputObject, SimpleObject};
use uuid::Uuid;

use crate::db::postgres::PostgresDB;

#[derive(InputObject, Debug)]
pub struct DeleteTransactionByIdV2Input {
    pub transaction_id: Uuid,
}

#[derive(SimpleObject)]
pub struct DeleteTransactionByIdV2Response {
    pub success: bool,
}

pub async fn delete_transaction_by_id_v2(
    inputs: DeleteTransactionByIdV2Input,
) -> Result<DeleteTransactionByIdV2Response> {
    let db = PostgresDB::new().await;
    let mut tx = db.transaction().await?;
    db.delete_transaction_by_id(&mut tx, inputs.transaction_id)
        .await
        .context("Failed to delete transaction by ID")?;

    tx.commit()
        .await
        .context("Failed to commit DB transaction")?;
    return Ok(DeleteTransactionByIdV2Response { success: true });
}
