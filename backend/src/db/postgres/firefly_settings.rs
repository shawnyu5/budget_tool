use anyhow::Context as _;
use anyhow::Result;
use rust_decimal::Decimal;
use sqlx::query;
use sqlx::query_as;
use tracing::instrument;
use tracing::{error, info};
use uuid::Uuid;

use crate::db::postgres::models::firefly::FireflyRow;
use crate::{
    db::postgres::{
        PostgresDB,
        models::{budget_allocation::BudgetAllocationRow, month::MonthRow},
    },
    month::Month,
};

impl PostgresDB {
    #[instrument(skip_all)]
    pub async fn get_user_firefly_settings(&self, user_id: Uuid) -> Result<FireflyRow> {
        let firefly = query_as!(
            FireflyRow,
            "
            SELECT * from firefly
            where user_id = $1
            ",
            user_id
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(firefly)
    }

    /// Update firefly settings for a specific user
    #[instrument(skip_all)]
    pub async fn update_user_firefly_settings(
        &self,
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
        .execute(&self.pool)
        .await
        .context("Failed to update firefly settings")?;

        Ok(())
    }
}
