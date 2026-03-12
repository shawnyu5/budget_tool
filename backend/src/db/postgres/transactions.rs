use anyhow::Result;
use chrono::DateTime;
use chrono::FixedOffset;
use rust_decimal::Decimal;
use sqlx::query;
use sqlx::query_as;
use tracing::error;
use uuid::Uuid;

use crate::db::postgres::models::Year;
use crate::db::postgres::models::transaction::TransactionRow;
use crate::{
    db::postgres::PostgresDB,
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
        .execute(&self.pool)
        .await
        .map_err(|e| {
            error!("Failed to insert new transaction: {e:#?}");
            e
        })?;

        Ok(())
    }

    /// Get transactions from in a specific time frame. Sort the transactions by date
    pub async fn get_transactions(&self, year: Year, month: Month) -> Result<Vec<TransactionRow>> {
        let transactions = query_as!(
            TransactionRow,
            "
            SELECT t.* FROM transactions t
            INNER JOIN months m ON m.id = t.month_id
            WHERE m.year = $1 AND m.month = $2
            ORDER BY t.date DESC
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

    /// Get a single transaction by ID
    pub async fn get_transaction_by_id(&self, id: Uuid) -> Result<Option<TransactionRow>> {
        let transaction = query_as!(
            TransactionRow,
            "
            SELECT * from transactions t
            WHERE t.id = $1
            ",
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
        description: Option<String>,
        notes: Option<String>,
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
