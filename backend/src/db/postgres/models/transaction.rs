use std::ops::Div;

use anyhow::{Context, Result};
use chrono::{DateTime, Datelike};
use rust_decimal::{Decimal, dec, prelude::ToPrimitive};
use sqlx::{PgConnection, prelude::FromRow};
use uuid::Uuid;

use crate::{db::postgres::PostgresDB, month::Month, utils::calculate_percentage};

/// A single transaction
#[derive(Debug, FromRow)]
pub struct TransactionRow {
    pub id: Uuid,
    pub month_id: Uuid,
    pub amount: Decimal,
    pub date: DateTime<chrono::FixedOffset>,
    pub description: Option<String>,
    pub notes: Option<String>,
    /// How a transaction is split between Shawn and Maggie
    pub split_mode: Option<SplitMode>,
}

/// Determines how a transaction is split between Shawn and Maggie
#[derive(Debug, sqlx::Type, async_graphql::Enum, Copy, Clone, Eq, PartialEq, PartialOrd)]
#[sqlx(type_name = "text", rename_all = "snake_case")]
pub enum SplitMode {
    /// Use the current month settings to calculate split
    FromSettings,
    /// Split 50/50
    Evenly,
}

impl TransactionRow {
    /// Split a transaction based on its split mode.
    /// Retrieves transaction split from settings to calculate split
    ///
    /// # Returns
    /// A tuple, where first element is Shawn's split, second is Maggie split
    ///
    /// Returns `None` if there's no split mode in the transaction, ie it was migrated from Mongo DB
    pub async fn split_transaction(
        &self,
        executor: &mut PgConnection,
    ) -> Result<Option<(Decimal, Decimal)>> {
        match self.split_mode {
            Some(SplitMode::FromSettings) => {
                let db = PostgresDB::new().await;
                let shawn = db
                    .get_user("shawn")
                    .await
                    .context("Failed to get user from DB")?;

                let shawn_budget_allocation = db
                    .get_or_insert_budget_allocation(
                        executor,
                        self.date.year(),
                        Month::from_number(self.date.month().try_into().unwrap()),
                        shawn.id,
                    )
                    .await
                    .context("Failed to get budget allocation")?;

                let shawn_split = calculate_percentage(
                    self.amount.to_f64().unwrap(),
                    shawn_budget_allocation
                        .percentage_allocation
                        .to_f64()
                        .unwrap(),
                );

                let maggie_split = calculate_percentage(
                    self.amount.to_f64().unwrap(),
                    100.0
                        - shawn_budget_allocation
                            .percentage_allocation
                            .to_f64()
                            .unwrap(),
                );

                return Ok(Some((
                    Decimal::from_f64_retain(shawn_split).unwrap(),
                    Decimal::from_f64_retain(maggie_split).unwrap(),
                )));
            }
            Some(SplitMode::Evenly) => {
                let split = self.amount.div(dec!(2));
                return Ok(Some((split, split)));
            }
            None => return Ok(None),
        }
    }
}

#[cfg(test)]
mod tests {
    use anyhow::{Context as _, Result};
    use chrono::Utc;
    use rust_decimal::dec;
    use sqlx::PgPool;
    use uuid::Uuid;

    use crate::{
        db::postgres::{
            PostgresDB,
            models::transaction::{SplitMode, TransactionRow},
        },
        month::Month,
    };

    #[sqlx::test]
    #[tracing_test::traced_test]
    /// Test splitting a transaction evenly
    async fn split_evenly(pool: PgPool) -> Result<()> {
        let db = PostgresDB { pool };
        let mut tx = db
            .transaction()
            .await
            .context("Failed to create transaction")?;

        let month = db
            .get_or_insert_month(&mut tx, 2026, Month::January)
            .await?;
        tx.commit().await?;

        let mut tx = db.transaction().await?;

        let transaction_row = TransactionRow {
            id: Uuid::new_v4(),
            month_id: month.id,
            amount: dec!(100),
            date: Utc::now().into(),
            description: None,
            notes: None,
            split_mode: Some(SplitMode::Evenly),
        };

        let (shawn, maggie) = transaction_row.split_transaction(&mut tx).await?.unwrap();
        assert_eq!(shawn, dec!(50));
        assert_eq!(maggie, dec!(50));

        Ok(())
    }

    /// Test splitting transaction according to budget allocation table
    #[sqlx::test]
    #[tracing_test::traced_test]
    async fn split_from_settings(pool: PgPool) -> Result<()> {
        let db = PostgresDB { pool };
        let mut tx = db.transaction().await?;
        let month = db
            .get_or_insert_month(&mut tx, 2026, Month::January)
            .await?;

        let core_users = db.get_core_users(&mut tx).await?;
        for user in core_users {
            db.insert_new_budget_allocation(
                &mut tx,
                2026,
                Month::January,
                user.id,
                dec!(50),
                dec!(100),
            )
            .await?;
        }

        tx.commit().await?;

        let mut tx = db.transaction().await?;

        let transaction_row = TransactionRow {
            id: Uuid::new_v4(),
            month_id: month.id,
            amount: dec!(100),
            date: Utc::now().into(),
            description: None,
            notes: None,
            split_mode: Some(SplitMode::FromSettings),
        };

        let (shawn, maggie) = transaction_row.split_transaction(&mut tx).await?.unwrap();
        assert_eq!(shawn, dec!(50));
        assert_eq!(maggie, dec!(50));

        Ok(())
    }
}
