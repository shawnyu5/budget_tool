//! PostgresDB impls for budget_allocations table
use anyhow::Context as _;
use anyhow::Result;
use rust_decimal::Decimal;
use sqlx::query;
use sqlx::query_as;
use tracing::{error, info};
use uuid::Uuid;

use crate::{
    db::postgres::{
        PostgresDB,
        models::{budget_allocation::BudgetAllocationRow, month::MonthRow},
    },
    month::Month,
};

impl PostgresDB {
    /// Get a budget allocation for a user in a specific month. If it doesnt exist, insert it into the table,
    /// Since there should always be a budget allocation for a specific month
    ///
    /// * `user_id`: The user to get the allocation for
    /// * `month_id`: the month to the allocation is for
    pub async fn get_or_insert_budget_allocation(
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
            info!("Fetching current month row from DB: month with ID {month_id}");
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

            info!(
                "Fetching previous month row from DB: year {0}, {prev_month}",
                current_month_row.year
            );
            let prev_month_row = query_as!(
                MonthRow,
                "
                SELECT * FROM months
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
            })
            .context("Failed to fetch previous month from DB")?;

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

    /// Insert a new budget allocation
    pub async fn insert_new_budget_allocation(
        &self,
        month_id: Uuid,
        user_id: Uuid,
        percentage_allocation: Decimal,
        contribution_amount: Decimal,
    ) -> Result<()> {
        query!("
            INSERT INTO budget_allocations (id, month_id, user_id, percentage_allocation, contribution_amount)
            VALUES ($1, $2, $3, $4, $5)
            ",
            Uuid::new_v4(),
            month_id,
            user_id,
            percentage_allocation,
            contribution_amount).execute(&self.pool).await.map_err(|e| {
            error!("{e:#?}");
            e
        })?;

        Ok(())
    }
}
