use anyhow::Context;
use anyhow::Result;
use sqlx::query_as;
use sqlx::{PgConnection, query};
use tracing::instrument;
use uuid::Uuid;

use crate::db::postgres::PostgresDB;
use crate::db::postgres::models::firefly_transactions::FireflyTransactionRow;

impl PostgresDB {
    #[instrument(skip_all)]
    /// Insert a new Firefly transaction
    pub async fn insert_firefly_transaction(
        &self,
        executor: &mut PgConnection,
        user_id: Option<Uuid>,
        transaction_id: Uuid,
        firefly_id: String,
        firefly_link: String,
    ) -> Result<()> {
        query!(
            "
            INSERT INTO firefly_transactions (id, transaction_id, firefly_id, firefly_link, user_id)
            VALUES ($1, $2, $3, $4, $5)
            ",
            Uuid::new_v4(),
            transaction_id,
            firefly_id,
            firefly_link,
            user_id
        )
        .execute(executor)
        .await
        .context("Failed to insert Firefly transaction")?;

        Ok(())
    }

    /// Get a firefly transactions associated with a specific Transaction.
    /// Since a single transaction is split 2 ways, there may be 2 Firefly transactions associated with a single transaction.
    pub async fn get_firfly_transactions(
        &self,
        executor: &mut PgConnection,
        transaction_id: Uuid,
    ) -> Result<Vec<FireflyTransactionRow>> {
        query_as!(
            FireflyTransactionRow,
            "
            SELECT * FROM firefly_transactions
            WHERE transaction_id = $1
            ",
            transaction_id
        )
        .fetch_all(executor)
        .await
        .context("Failed to fetch transaction")
    }
}
