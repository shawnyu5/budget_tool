use anyhow::{Context, Result};
use chrono::{DateTime, NaiveDate};
use chrono_tz::Tz;
use rust_decimal::Decimal;
use sqlx::{
    Error, Pool, Postgres, Transaction, migrate::Migrator, postgres::PgPoolOptions, query, query_as,
};
use tracing::{error, info, instrument};
use uuid::Uuid;

use crate::month::Month;
use crate::{
    config::Config,
    db::postgres::models::{
        Year, budget_allocation::BudgetAllocationRow, firefly::FireflyRow, month::MonthRow,
        user::UserRow,
    },
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

    /// Get a budget allocation for a user in a specific month. If it doesnt exist, insert it into the table,
    /// Since there should always be a budget allocation for a specific month
    ///
    /// * `user_id`: The user to get the allocation for
    /// * `month_id`: the month to the allocation is for
    pub async fn get_or_create_budget_allocation(
        &self,
        user_id: Uuid,
        month_id: Uuid,
    ) -> Result<BudgetAllocationRow> {
        let budget_allocation_row = query_as!(
            BudgetAllocationRow,
            "
            SELECT * FROM budget_allocations
            WHERE user_id = $1 AND month_id = $2
            ",
            user_id,
            month_id
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| {
            error!("{e:#?}");
            e
        })
        .context("Failed to fetch from budget_allocations table")?;

        if let Some(row) = budget_allocation_row {
            Ok(row)
        } else {
            info!(
                "No budget allocation record for current month. Creating from previous month record"
            );
            info!("Fetching current month row from DB");
            let current_month_row = query_as!(
                MonthRow,
                "
                SELECT * FROM months
                WHERE id = $1
                ",
                month_id
            )
            .fetch_one(&self.pool)
            .await
            .map_err(|e| {
                error!("{e:#?}");
                e
            })
            .context("Failed to fetch month row")?;

            let prev_month = {
                // If we are at the beginning of the year, then wrap to December
                if current_month_row.month == Month::January {
                    Month::December
                } else {
                    // Subtract one month
                    current_month_row.month - Month::January
                }
            };

            info!("Fetching previous month row from DB");
            let prev_month_row = query_as!(
                MonthRow,
                "
                SElECT * FROM months
                WHERE year = $1 AND month = $2
                ",
                current_month_row.year,
                prev_month.to_string(),
            )
            .fetch_one(&self.pool)
            .await
            .map_err(|e| {
                error!("{e:#?}");
                e
            })?;

            let prev_budget_allocation = query_as!(
                BudgetAllocationRow,
                "
                SELECT * FROM budget_allocations
                WHERE month_id = $1 AND user_id = $2
                ",
                prev_month_row.id,
                user_id
            )
            .fetch_one(&self.pool)
            .await
            .map_err(|e| {
                error!("{e:#?}");
                e
            })
            .context("Failed to fetch previous month budget allocation")?;

            info!("Inserting current month budget allocation row");
            let budget_allocation_row  = query_as!(
                BudgetAllocationRow,
                "
                INSERT INTO budget_allocations (id, month_id, percentage_allocation, contribution_amount, user_id)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *;
                ",
                Uuid::new_v4(),
                month_id,
                prev_budget_allocation.percentage_allocation,
                prev_budget_allocation.contribution_amount,
                user_id
            )
                .fetch_one(&self.pool)
                .await.map_err(|e| {
                error!("{e:#?}");
                e
            })?;
            Ok(budget_allocation_row)
        }
    }

    pub async fn update_budget_allocation(
        &self,
        user_id: Uuid,
        month_id: Uuid,
        percentage_allocation: Decimal,
        contribution_amount: Decimal,
    ) -> Result<()> {
        query!(
            "
            UPDATE budget_allocations
            SET
                percentage_allocation = $1,
                contribution_amount = $2
            WHERE user_id = $3 AND month_id = $4
            ",
            percentage_allocation,
            contribution_amount,
            user_id,
            month_id
        )
        .execute(&self.pool)
        .await
        .map_err(|e| {
            error!("{:#?}", e);
            e
        })?;

        Ok(())
    }

    /// Fetch the core users (Shawn + Maggie) of the system from the DB
    pub async fn get_core_users(&self) -> Result<Vec<UserRow>> {
        let users = query_as!(
            UserRow,
            "
            SELECT * FROM users
            WHERE username = $1 OR username = $2
            ",
            "shawn",
            "maggie"
        )
        .fetch_all(&self.pool)
        .await?;

        assert_eq!(
            users.len(),
            2,
            "There should be no more than 2 core users fetched from DB"
        );

        Ok(users)
    }

    /// Get the total allocation for a specific month
    pub async fn compute_total_allocation(&self, month_id: Uuid) -> Result<Decimal> {
        let core_users = self.get_core_users().await?;
        let row = query!(
            "
            SELECT COALESCE(SUM(contribution_amount), 0) AS total_allocation
            FROM budget_allocations
            WHERE
            month_id = $1 AND
            (user_id = $2 OR user_id = $3)
            ",
            month_id,
            core_users[0].id,
            core_users[1].id,
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(row.total_allocation.unwrap_or_default())
    }

    /// Insert a new transaction for a specific month
    ///
    /// * `month_id`: the month this new transaction is for
    pub async fn insert_new_transaction(
        &self,
        month_id: Uuid,
        amount: Decimal,
        date: DateTime<Tz>,
        description: String,
        notes: String,
    ) -> Result<()> {
        query!(
            "
            INSERT INTO transactions (id, month_id, amount, date, description, notes)
            VALUES ($1, $2, $3, $4, $5, $6)
            ",
            Uuid::new_v4(),
            month_id,
            amount,
            date,
            description,
            notes
        )
        .execute(&self.pool)
        .await
        .map_err(|e| {
            error!("Failed to insert new transaction: {e:#?}");
            e
        })?;

        Ok(())
    }
}
