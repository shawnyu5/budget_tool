//! PostgresDB impls for budget_allocations table
use anyhow::Context as _;
use anyhow::Result;
use rust_decimal::Decimal;
use sqlx::PgConnection;
use sqlx::query;
use sqlx::query_as;
use tracing::instrument;
use tracing::{error, info};
use uuid::Uuid;

use crate::db::postgres::models::Year;
use crate::{
    db::postgres::{
        PostgresDB,
        models::{budget_allocation::BudgetAllocationRow, month::MonthRow},
    },
    month::Month,
};

impl PostgresDB {
    /// Get a budget allocation for a user in a specific month. If it doesnt exist, insert it into the table, using data from the previous month,
    /// Since there should always be a budget allocation for a specific month
    ///
    /// * `user_id`: The user to get the allocation for
    /// * `month_id`: the month to the allocation is for
    #[instrument(skip_all)]
    pub async fn get_or_insert_budget_allocation(
        &self,
        executor: &mut PgConnection,
        year: Year,
        month: Month,
        user_id: Uuid,
    ) -> Result<BudgetAllocationRow> {
        // Get month from months table to validate it exists. If it does not, create it first
        if query!(
            "
            SELECT * from months m
            WHERE m.year = $1 AND m.month = $2
            ",
            year,
            month.to_string()
        )
        .fetch_optional(&mut *executor)
        .await?
        .is_none()
        {
            // if the month record does not exist, insert it into the table first
            info!("Month {month} does not exist in months table. Inserting...");
            self.insert_new_month(year, month).await.map_err(|e| {
                error!("{e:#?}");
                e
            })?;
        };

        let budget_allocation_row = query_as!(
            BudgetAllocationRow,
            "
            SELECT ba.* FROM budget_allocations ba
            INNER JOIN months m ON m.id = ba.month_id
            WHERE
                m.year = $1
                AND m.month = $2
                AND ba.user_id = $3
            ",
            year,
            month.to_string(),
            user_id,
        )
        .fetch_optional(&mut *executor)
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
                "No budget allocation record for current month {month}. Creating from previous month record"
            );
            info!("Fetching current month row {month} from months table");
            let current_month_row = query_as!(
                MonthRow,
                "
                SELECT * FROM months
                WHERE year = $1 AND month = $2
                ",
                year,
                month.to_string(),
            )
            .fetch_one(&mut *executor)
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

            info!("Fetching previous month row from DB: year {year}, {prev_month}");
            let prev_month_row = query_as!(
                MonthRow,
                "
                SELECT * FROM months
                WHERE year = $1 AND month = $2
                ",
                current_month_row.year,
                prev_month.to_string(),
            )
            .fetch_one(&mut *executor)
            .await
            .map_err(|e| {
                error!("{e:#?}");
                e
            })
            .context("Failed to fetch previous month from DB")?;

            info!("Fetching previous month budget allocation");
            let prev_budget_allocation = query_as!(
                BudgetAllocationRow,
                "
                SELECT * FROM budget_allocations
                WHERE month_id = $1 AND user_id = $2
                ",
                prev_month_row.id,
                user_id
            )
            .fetch_one(&mut *executor)
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
                SELECT
                    $3,
                    m.id,
                    $4,
                    $5,
                    $6
                FROM months m
                WHERE m.year = $1 AND m.month = $2
                RETURNING *;
                ",
                year,
                month.to_string(),
                Uuid::new_v4(),
                prev_budget_allocation.percentage_allocation,
                prev_budget_allocation.contribution_amount,
                user_id
            )
                .fetch_one(executor)
                .await.map_err(|e| {
                error!("Failed to insert current budget allocation: {e:#?}");
                e
            })?;
            Ok(budget_allocation_row)
        }
    }

    /// Insert a new budget allocation
    /// This is only used in Mongo migration and unit testing. Will consider removing this...
    pub async fn insert_new_budget_allocation(
        &self,
        executor: &mut PgConnection,
        year: Year,
        month: Month,
        user_id: Uuid,
        percentage_allocation: Decimal,
        contribution_amount: Decimal,
    ) -> Result<()> {
        let month_row = self
            .get_or_insert_month(executor, year, month)
            .await
            .context("Failed to get from months table")?;
        query!(
            "
            INSERT INTO budget_allocations (
                id,
                month_id,
                user_id,
                percentage_allocation,
                contribution_amount
            )
            SELECT
                $3,
                m.id,
                $4,
                $5,
                $6
            FROM months m
            WHERE m.year = $1 AND m.month = $2
            ",
            year,
            month_row.month.to_string(),
            Uuid::new_v4(),
            user_id,
            percentage_allocation,
            contribution_amount
        )
        .execute(&mut *executor)
        .await
        .map_err(|e| {
            error!("{e:#?}");
            e
        })?;
        Ok(())
    }

    pub async fn update_budget_allocation(
        &self,
        executor: impl sqlx::PgExecutor<'_>,
        year: Year,
        month: Month,
        user_id: Uuid,
        percentage_allocation: Decimal,
        contribution_amount: Decimal,
    ) -> Result<()> {
        query!(
            "
            UPDATE budget_allocations ba
            SET
                percentage_allocation = $1,
                contribution_amount = $2
            FROM months m
            WHERE ba.month_id = m.id
                AND ba.user_id = $3
                AND m.year = $4
                and m.month = $5
            ",
            percentage_allocation,
            contribution_amount,
            user_id,
            year,
            month.to_string()
        )
        .execute(executor)
        .await
        .map_err(|e| {
            error!("{:#?}", e);
            e
        })?;

        Ok(())
    }
}
