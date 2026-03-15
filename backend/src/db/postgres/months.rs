use anyhow::Context as _;
use anyhow::Result;
use sqlx::PgConnection;
use sqlx::query_as;
use tracing::error;
use tracing::info;
use tracing::instrument;
use uuid::Uuid;

use crate::db::postgres::models::Year;
use crate::{
    db::postgres::{PostgresDB, models::month::MonthRow},
    month::Month,
};

impl PostgresDB {
    #[instrument(skip_all)]
    pub async fn get_or_insert_month(
        &self,
        executor: &mut PgConnection,
        year: Year,
        month: Month,
    ) -> Result<MonthRow> {
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
        .fetch_optional(&mut *executor)
        .await
        .map_err(|e| {
            error!("{:#?}", e);
            e
        })
        .context("Failed to fetch month from DB")?;

        if month_row.is_none() {
            info!("Year {year} month {month} does not exist in months table, inserting... ");
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
            .fetch_one(&mut *executor)
            .await
            .map_err(|e| {
                error!("{e:#?}");
                e
            })?;

            return Ok(month);
        }

        info!("Year {year} month {month} does exist in months table. Returning existing record");
        // There should always be a month row here, since we check its not none right before
        return Ok(month_row.unwrap());
    }
    /// Get a specific month from the Months table
    #[instrument(skip_all)]
    #[deprecated = "Use `get_or_insert_month() to handle months rollover`"]
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
