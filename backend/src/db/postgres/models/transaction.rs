use std::ops::Div;

use anyhow::{Context, Result};
use chrono::{DateTime, Datelike};
use rust_decimal::{Decimal, dec, prelude::ToPrimitive};
use sqlx::{PgConnection, prelude::FromRow};
use uuid::Uuid;

use crate::{db::postgres::PostgresDB, utils::calculate_percentage};

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
    /// A tuple, where first element is Shawn split, second is Maggie split
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
                        self.date.month().to_string().into(),
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
    // TODO: write tests for split_transaction()
}
