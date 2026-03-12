use anyhow::Result;
use rust_decimal::Decimal;
use sqlx::{
    Error, Pool, Postgres, Transaction, migrate::Migrator, postgres::PgPoolOptions, query,
};
use tracing::{error, instrument};

use crate::month::Month;
use crate::{
    config::Config,
    db::postgres::models::Year,
};

pub mod budget_allocation;
pub mod firefly_settings;
pub mod models;
pub mod months;
pub mod transactions;
pub mod user;

static MIGRATOR: Migrator = sqlx::migrate!("./migrations");

/// Interface for database operations with Postgres
pub struct PostgresDB {
    pool: Pool<Postgres>,
}

impl PostgresDB {
    /// Connect to a new DB
    #[instrument(skip_all)]
    pub async fn new() -> Self {
        let config = Config::load();
        let pool = PgPoolOptions::new()
            .max_connections(5)
            .connect(&config.postgres_url)
            .await
            .expect("Failed to connect to Postgres DB");

        Self { pool }
    }

    #[instrument(skip_all)]
    /// Start a transaction
    pub async fn transaction(&self) -> Result<Transaction<'_, Postgres>, Error> {
        self.pool.begin().await
    }

    /// Perform all sqlx migrations
    #[instrument(skip_all)]
    pub async fn do_migrations(&self) -> Result<()> {
        MIGRATOR.run(&self.pool).await?;
        return Ok(());
    }

    /// Get the total allocation for a specific time frame
    pub async fn compute_total_allocation(&self, year: Year, month: Month) -> Result<Decimal> {
        let row = query!(
            "
            SELECT COALESCE(SUM(contribution_amount), 0) AS total_allocation
            FROM budget_allocations b
            INNER JOIN months m ON m.id = b.month_id
            WHERE m.year = $1 AND m.month = $2
            ",
            year,
            month.to_string(),
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(row.total_allocation.unwrap_or_default())
    }

    /// Calculate the total spending for a time period
    pub async fn compute_total_spend(&self, year: Year, month: Month) -> Result<Decimal> {
        let record = query!(
            "
            SELECT COALESCE(SUM(t.amount), 0) AS total_spent
            FROM months m
            LEFT JOIN transactions t ON m.id = t.month_id
            WHERE m.year = $1 AND m.month = $2
            ",
            year,
            month.to_string()
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| {
            error!("{e:#?}");
            e
        })?;

        Ok(record.total_spent.unwrap())
    }
}
