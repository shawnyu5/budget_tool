use anyhow::{anyhow, Context, Result};
use chrono::{Datelike, Utc};
use mongodb::{bson::doc, Client, Collection, Database};
use serde::{Deserialize, Serialize};
use thiserror::Error;
use tracing::{debug, error, info};
use utoipa::ToSchema;

use crate::{
    config::Config,
    month::{Month, MonthError},
};

#[derive(Error, Debug)]
pub enum DBError {
    /// There are no budget information found for the current budgeting period
    #[error("Budget not found")]
    BudgetNotFound,
    /// DB related errors
    #[error("Database related erorrs: {0}")]
    DB(#[from] mongodb::error::Error),
    /// Input is an invalid year
    #[error("Invalid year")]
    InvalidYear,
    /// Generic error
    #[error("A generic non recoverable error")]
    Generic(#[from] anyhow::Error),
}
/// Interface for database operations
pub struct DB {
    /// The DB client
    client: Client,
    /// The current collection of the current year to operate on
    pub collection: Collection<MonthlyBudget>,
}

impl DB {
    /// Creates a new db connection
    ///
    /// * `year`: the year to get budget of
    pub async fn new(year: String) -> Result<Self> {
        if year.len() != 4 {
            return Err(DBError::InvalidYear.into());
        }

        let client = Client::with_uri_str(Config::load().db_connection_string).await?;
        debug!("Attempting to ping db after initializing connection");
        client
            .database("budget_tool")
            .run_command(doc! { "ping": 1 })
            .await
            .context("Failed to ping db")?;
        debug!("Pinging successful");

        let collection = client
            .database("budget_tool")
            .collection::<MonthlyBudget>(&year);
        debug!("Setting collection to db budget_tool, in collection {year}");

        return Ok(Self { client, collection });
    }

    /// Get the budget information for a selected month
    ///
    /// * `month`: the month to get budget for
    ///
    /// If no budget information is found for current month, it will check the previous month. It will continue to go back in time until either a budget information for a month is found, or all months in a year has been traversed
    ///
    /// # Errors
    /// This function will return an error if:
    /// - connection to the DB fails
    /// - There are no budget found for the current month
    pub async fn get_month_budget(&self, month: Month) -> Result<MonthlyBudget, DBError> {
        let mut mut_month = month;
        // flag to determine if we are looking for budgeting records in previous months
        let mut trying_prev_months = false;
        loop {
            match self
                .collection
                .find_one(doc! {
                    "month": mut_month.to_string()
                })
                .await?
            {
                Some(mut month_spending) => {
                    info!("Found budget information in month {mut_month}");
                    // If the found budget does not match the current month, then we need to clean up the spending history. Spending history must not be carried over. All other information should be carry over
                    if trying_prev_months {
                        month_spending.spending = vec![];
                        // Also correct the month to the one being queried
                        month_spending.month = month;
                    }
                    return Ok(month_spending);
                }
                None => {
                    info!("No budget information in month {mut_month} found");
                    match mut_month - Month::from_number(1).unwrap() {
                        Ok(prev_month) => {
                            info!("Trying previous month {mut_month}");
                            mut_month = prev_month;
                            trying_prev_months = true;
                        }
                        Err(MonthError::InvalidMonth) => {
                            // There are no more months to check
                            return Err(DBError::BudgetNotFound);
                        }
                    }
                }
            }
        }
    }
}

/// Budget details for single month
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct MonthlyBudget {
    /// The month
    pub month: Month,
    /// Budget details
    pub budget: Budget,
    /// List of spent items
    pub spending: Vec<Spending>,
}

impl MonthlyBudget {
    /// Get the budget for the previous month. Will continue to go back until a month with a budget is found
    ///
    /// * `year`: the year to get the budget of
    pub async fn prev_month(&mut self, year: String) -> Option<Self> {
        let db = match DB::new(year).await {
            Ok(db) => db,
            Err(e) => {
                error!("Failed to initialize DB: {}", e);
                return None;
            }
        };
        loop {
            match self.month - Month::from_number(1).unwrap() {
                Ok(prev) => {
                    let month_budget = db.get_month_budget(prev).await;

                    match month_budget {
                        Ok(month_budget) => return Some(month_budget),
                        Err(DBError::BudgetNotFound) => {
                            // If this month has no budget information, check previous month
                            let month = match self.month - Month::from_number(1).unwrap() {
                                Ok(month) => month,
                                Err(e) => {
                                    // If we cant subtract 1 from the current month anymore, that means we've ran out of months. There is no more budget left to check
                                    error!(
                                            "Failed to substract 1 from current month: {}. There are no more budget information left to check",
                                            e.to_string()
                                        );
                                    return None;
                                }
                            };
                            self.month = month;
                        }
                        Err(e) => {
                            error!(
                                "Failed to fetch budget for month {month}: {err}",
                                month = self.month,
                                err = e
                            );
                            return None;
                        }
                    }
                }
                Err(_) => {
                    // No previous months
                    return None;
                }
            };
        }
    }
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct Budget {
    /// Total allocated budget
    pub total: i64,
    #[serde(rename = "shawn_percentage_allocation")]
    pub shawn_percentage_allocation: i64,
    #[serde(rename = "maggie_percentage_allocation")]
    pub maggie_percentage_allocation: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct Spending {
    /// A unique identifier
    #[serde(default)]
    pub id: String,
    /// The dollar amount
    pub amount: i64,
    /// The date
    pub date: String,
    /// Description of the purchase
    pub description: String,
    /// Additional notes
    pub notes: Option<String>,
}

impl Default for Spending {
    fn default() -> Self {
        Self {
            id: Utc::now().to_string(),
            amount: Default::default(),
            date: Default::default(),
            description: Default::default(),
            notes: Default::default(),
        }
    }
}
