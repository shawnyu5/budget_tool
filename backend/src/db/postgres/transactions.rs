use anyhow::Result;
use chrono::DateTime;
use chrono::FixedOffset;
use rust_decimal::Decimal;
use sqlx::PgConnection;
use sqlx::query;
use sqlx::query_as;
use tracing::error;
use uuid::Uuid;

use crate::db::postgres::models::Year;
use crate::db::postgres::models::transaction::{SplitMode, TransactionRow};
use crate::{db::postgres::PostgresDB, month::Month};

impl PostgresDB {
    /// Insert a new transaction for a specific month
    #[allow(clippy::too_many_arguments)]
    pub async fn insert_new_transaction(
        &self,
        executor: &mut PgConnection,
        year: Year,
        month: Month,
        id: Uuid,
        amount: Decimal,
        date: DateTime<FixedOffset>,
        description: &str,
        notes: &str,
        split_mode: Option<SplitMode>,
    ) -> Result<TransactionRow> {
        let row = query_as!(
            TransactionRow,
            r#"
            INSERT INTO transactions (id, month_id, amount, date, description, notes, split_mode)
            SELECT $1, m.id, $4, $5, $6, $7, $8::split_mode AS "split_mode: SplitMode"
            FROM months m
            WHERE m.month = $2 AND m.year = $3
            RETURNING id, month_id, amount, date, description, notes, split_mode AS "split_mode: SplitMode"
            "#,
            id,
            month.to_string(),
            year,
            amount,
            date,
            description,
            notes,
            split_mode as Option<SplitMode>
        )
        .fetch_one(executor)
        .await
        .map_err(|e| {
            error!("Failed to insert new transaction: {e:#?}");
            e
        })?;

        Ok(row)
    }

    /// Get transactions from in a specific time frame. Sort the transactions by date
    pub async fn get_transactions(
        &self,
        executor: &mut PgConnection,
        year: Year,
        month: Month,
    ) -> Result<Vec<TransactionRow>> {
        let transactions = query_as!(
            TransactionRow,
            r#"
            SELECT
                t.id,
                t.month_id,
                t.amount,
                t.date,
                t.description,
                t.notes,
                t.split_mode as "split_mode: SplitMode"
            FROM transactions t
            INNER JOIN months m ON m.id = t.month_id
            WHERE m.year = $1 AND m.month = $2
            ORDER BY t.date DESC
            "#,
            year,
            month.to_string(),
        )
        .fetch_all(executor)
        .await
        .map_err(|e| {
            error!("{e:#?}");
            e
        })?;

        return Ok(transactions);
    }

    /// Get a single transaction by ID
    pub async fn get_transaction_by_id(&self, id: Uuid) -> Result<Option<TransactionRow>> {
        let transaction = query_as!(
            TransactionRow,
            r#"
            SELECT
                t.id,
                t.month_id,
                t.amount,
                t.date,
                t.description,
                t.notes,
                t.split_mode as "split_mode: SplitMode"
            FROM transactions t
            WHERE t.id = $1
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| {
            error!("{e:#?}");
            e
        })?;

        return Ok(transaction);
    }

    /// Update a transaction by ID
    pub async fn update_transaction_by_id(
        &self,
        id: Uuid,
        amount: Decimal,
        date: DateTime<chrono::FixedOffset>,
        description: Option<&str>,
        notes: Option<&str>,
    ) -> Result<()> {
        query!(
            "
            UPDATE transactions
            SET
                amount = $2,
                date = $3,
                description = $4,
                notes = $5
            WHERE id = $1
            ",
            id,
            amount,
            date,
            description,
            notes
        )
        .execute(&self.pool)
        .await
        .map_err(|e| {
            error!("{e:#?}");
            e
        })?;

        return Ok(());
    }

    /// Delete a transaction by ID
    pub async fn delete_transaction_by_id(&self, id: Uuid) -> Result<()> {
        query!(
            "
        DELETE FROM transactions t
        WHERE t.id = $1
        ",
            id,
        )
        .execute(&self.pool)
        .await
        .map_err(|e| {
            error!("{e:#?}");
            e
        })?;

        return Ok(());
    }
}
