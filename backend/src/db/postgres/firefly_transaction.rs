use anyhow::Context;
use anyhow::Result;
use sqlx::{PgConnection, query};
use tracing::instrument;
use uuid::Uuid;

use crate::db::postgres::PostgresDB;

impl PostgresDB {
    #[instrument(skip_all)]
    /// Insert a new Firefly transaction
    pub async fn insert_firefly_transaction(
        &self,
        executor: &mut PgConnection,
        transaction_id: Uuid,
        firefly_id: String,
        firefly_link: String,
    ) -> Result<()> {
        query!(
            "
            INSERT INTO firefly_transactions (id, transaction_id, firefly_id, firefly_link)
            VALUES ($1, $2, $3, $4)
            ",
            Uuid::new_v4(),
            transaction_id,
            firefly_id,
            firefly_link
        )
        .execute(executor)
        .await
        .context("Failed to insert Firefly transaction")?;

        Ok(())
    }
}
