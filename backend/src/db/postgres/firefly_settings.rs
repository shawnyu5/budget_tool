use anyhow::Context as _;
use anyhow::Result;
use sqlx::PgConnection;
use sqlx::query;
use sqlx::query_as;
use tracing::instrument;
use uuid::Uuid;

use crate::db::postgres::PostgresDB;
use crate::db::postgres::models::firefly::FireflyRow;

impl PostgresDB {
    #[instrument(skip_all)]
    pub async fn get_user_firefly_settings(
        &self,
        executor: &mut PgConnection,
        user_id: Uuid,
    ) -> Result<FireflyRow> {
        let firefly = query_as!(
            FireflyRow,
            "
            SELECT * from firefly
            where user_id = $1
            ",
            user_id
        )
        .fetch_one(executor)
        .await?;

        Ok(firefly)
    }

    /// Update firefly settings for a specific user
    #[instrument(skip_all)]
    pub async fn update_user_firefly_settings(
        &self,
        executor: &mut PgConnection,
        user_id: Uuid,
        enabled: bool,
        api_key: Option<String>,
        encryption_nounce: Option<String>,
        source_account: Option<String>,
    ) -> Result<()> {
        query!(
            "
            UPDATE firefly
            SET
                enabled = $1,
                api_key = $2,
                encryption_nounce = $3,
                source_account = $4
            WHERE user_id = $5
            ",
            enabled,
            api_key,
            encryption_nounce,
            source_account,
            user_id
        )
        .execute(executor)
        .await
        .context("Failed to update firefly settings")?;

        Ok(())
    }
}
