use anyhow::{Context, Result};
use mongodb::{bson::doc, Client, Collection};
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
    // TODO: consider removing this
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
            .database(&Config::load().database_name)
            .collection::<MonthlyBudget>(&year);
        debug!("Setting collection to db budget_tool, in collection {year}");

        return Ok(Self { client, collection });
    }

    /// Get the budget information for a selected month
    ///
    /// * `month`: the month to get budget for
    ///
    /// If no budget information is found for current month, it will check the previous month. It will continue to go back in time until a budget information for a month is found
    ///
    /// # Errors
    /// This function will return an error if:
    /// - connection to the DB fails
    pub async fn get_month_budget(&self, month: Month) -> Result<MonthlyBudget, DBError> {
        let mut month_to_check = month;
        let mut collection = self.collection.clone();
        info!(
            "Checking month {month} {collection_year}",
            collection_year = collection.name()
        );

        // flag to determine if we are looking for budgeting records in previous months
        let mut trying_prev_months = false;
        loop {
            match collection
                .find_one(doc! {
                    "month": month_to_check.to_string()
                })
                .await?
            {
                Some(mut month_spending) => {
                    info!("Found budget information in month {month_to_check}");
                    // If the found budget does not match the current month, then we need to clean up the spending history. Spending history must not be carried over. All other information should be carry over
                    if trying_prev_months {
                        month_spending.spending = vec![];
                        // Also correct the month to the one being queried
                        month_spending.month = month;
                        month_spending.carried_over_from = Some(month_to_check);
                    }
                    // month_spending.populate_spending_id();
                    return Ok(month_spending);
                }
                None => {
                    info!("No budget information in month {month_to_check} found");
                    match month_to_check - Month::from_number(1).unwrap() {
                        Ok(prev_month) => {
                            month_to_check = prev_month;
                            trying_prev_months = true;
                            info!("Trying previous month {month_to_check}");
                        }
                        Err(MonthError::InvalidMonth) => {
                            // If there are no more months in the current year, start at the beginning of previous year
                            let collection_year: i32 = collection
                                .name()
                                .parse()
                                .context("Failed to parse collection into valid year")?;
                            let prev_collection_year = collection_year - 1;
                            info!("There are no more months in current year to check. Checking previous year: {prev_collection_year}");

                            collection =
                                self.client
                                    .database(&Config::load().database_name)
                                    .collection::<MonthlyBudget>(&prev_collection_year.to_string());

                            month_to_check = Month::from_number(12).unwrap();
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
    pub spending: Vec<SpendingItem>,
    /// The month it was carried over from
    /// If the setting are not carried over from a previous month, this value will be empty
    pub carried_over_from: Option<Month>,
}

// impl MonthlyBudget {
//     /// Check all spending records. If they dont have an ID, create one for it
//     pub fn populate_spending_id(&mut self) {
//         self.spending.par_iter_mut().for_each(|spending| {
//             if spending.id.is_empty() {
//                 spending.id = Local::now().to_string();
//             }
//         });
//     }
// }

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

/// A single transaction
#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct SpendingItem {
    /// A unique identifier
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
