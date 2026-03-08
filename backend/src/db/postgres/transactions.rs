use anyhow::Context as _;
use anyhow::Result;
use chrono::DateTime;
use chrono::FixedOffset;
use chrono_tz::Tz;
use rust_decimal::Decimal;
use sqlx::query;
use sqlx::query_as;
use tracing::instrument;
use tracing::{error, info};
use uuid::Uuid;

use crate::db::postgres::models::Year;
use crate::db::postgres::models::transaction::TransactionRow;
use crate::{
    db::postgres::{
        PostgresDB,
        models::{budget_allocation::BudgetAllocationRow, month::MonthRow},
    },
    month::Month,
};

impl PostgresDB {
    /// Insert a new transaction for a specific month
    ///
    /// * `month_id`: the month this new transaction is for
    pub async fn insert_new_transaction(
        &self,
        month: Month,
        year: Year,
        // month_id: Uuid,
        amount: Decimal,
        date: DateTime<FixedOffset>,
        description: String,
        notes: String,
    ) -> Result<()> {
        query!(
            "
            INSERT INTO transactions (id, month_id, amount, date, description, notes)
            SELECT $1, m.id, $4, $5, $6, $7
            FROM months m
            WHERE m.month = $2 AND m.year = $3
            ",
            Uuid::new_v4(),
            month.to_string(),
            year,
            amount,
            date,
            description,
            notes,
        )
        // query!(
        //     "
        //     INSERT INTO transactions (id, month_id, amount, date, description, notes)
        //     VALUES ($1, $2, $3, $4, $5, $6)
        //     ",
        //     Uuid::new_v4(),
        //     month_id,
        //     amount,
        //     date,
        //     description,
        //     notes
        // )
        .execute(&self.pool)
        .await
        .map_err(|e| {
            error!("Failed to insert new transaction: {e:#?}");
            e
        })?;

        Ok(())
    }

    /// Get transactions from in a specific time frame
    pub async fn get_transactions(&self, year: Year, month: Month) -> Result<Vec<TransactionRow>> {
        let transactions = query_as!(
            TransactionRow,
            "
            SELECT t.* FROM transactions t
            INNER JOIN months m ON m.id = t.month_id
            WHERE m.year = $1 AND m.month = $2
            ",
            year,
            month.to_string(),
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| {
            error!("{e:#?}");
            e
        })?;

        return Ok(transactions);
    }
}
