use anyhow::Context as _;
use anyhow::Result;
use sqlx::query_as;
use tracing::error;
use tracing::instrument;
use uuid::Uuid;

use crate::db::postgres::models::Year;
use crate::{
    db::postgres::{PostgresDB, models::month::MonthRow},
    month::Month,
};

impl PostgresDB {
    /// Get a specific month from the Months table
    #[instrument(skip_all)]
    pub async fn get_month(&self, year: Year, month: Month) -> Result<Option<MonthRow>> {
        let month_row = query_as!(
            MonthRow,
            "
            SELECT * FROM months
            WHERE
                year = $1 AND month = $2
            ",
            year,
            month.to_string(),
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| {
            error!("{:#?}", e);
            e
        })
        .context("Failed to fetch month from DB")?;
        Ok(month_row)
    }

    /// Insert a new month into the months table
    pub async fn insert_new_month(&self, year: Year, month: Month) -> Result<MonthRow> {
        let month = query_as!(
            MonthRow,
            "
            INSERT INTO months (id, year, month)
            VALUES ($1, $2, $3)
            RETURNING *;
            ",
            Uuid::new_v4(),
            year,
            month.to_string(),
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| {
            error!("{e:#?}");
            e
        })?;

        Ok(month)
    }
}
