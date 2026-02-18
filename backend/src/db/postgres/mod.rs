use anyhow::{Context, Result};
use rust_decimal::Decimal;
use sqlx::{
    Error, Pool, Postgres, Transaction, migrate::Migrator, postgres::PgPoolOptions, query, query_as,
};
use tracing::instrument;
use uuid::Uuid;

use crate::{
    config::Config,
    db::postgres::models::{Year, firefly::FireflyRow, month::MonthRow, user::UserRow},
    month::Month,
};

pub mod models;

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
    pub async fn begin(&self) -> Result<Transaction<'_, Postgres>, Error> {
        self.pool.begin().await
    }

    /// Perform all sqlx migrations
    #[instrument(skip_all)]
    pub async fn do_migrations(&self) -> Result<()> {
        MIGRATOR.run(&self.pool).await?;
        return Ok(());
    }

    /// Get a user by their username
    #[instrument(skip_all)]
    pub async fn get_user(&self, username: &str) -> Result<UserRow> {
        let user = query_as!(
            UserRow,
            "
            SELECT * FROM users
            WHERE username = $1
            ",
            username
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(user)
    }
    /// Update an existing user
    #[instrument(skip_all)]
    pub async fn update_user(&self, username: &str, user: &UserRow) -> Result<()> {
        query!(
            "
        UPDATE users
        SET username = $1
        WHERE id = $2
        ",
            username,
            user.id
        )
        .execute(&self.pool)
        .await
        .context("Failed to update user")?;

        Ok(())
    }

    /// Get a specific month from the Months table
    #[instrument(skip_all)]
    pub async fn get_month(&self, year: Year, month: i32) -> Result<MonthRow> {
        let month_row = query_as!(
            MonthRow,
            "
            SELECT * FROM months
            WHERE
                year = $1 AND month = $2
            ",
            year,
            month
        )
        .fetch_one(&self.pool)
        .await
        .context("Failed to fetch month from DB")?;

        Ok(month_row)
    }

    #[instrument(skip_all)]
    pub async fn update_month(
        &self,
        year: Year,
        month: i32,
        total_allocation: Decimal,
    ) -> Result<()> {
        query!(
            "
            UPDATE months
            SET
                total_allocation = $1
            WHERE
                year = $2 AND month = $3
            ",
            total_allocation,
            year,
            month
        )
        .execute(&self.pool)
        .await?;

        return Ok(());
    }

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
