//! Module for DB related operations

use anyhow::{Context, Result};
use mongodb::{bson::doc, Client, Collection};
use thiserror::Error;
use tracing::{debug, error, info};

use crate::{
    config::Config,
    month::{Month, MonthError},
    monthly_budget::MonthlyBudget,
};

impl DB {
    /// Creates a new db connection
    ///
    /// * `year`: the year to get budget of
    pub async fn new(year: String) -> Result<Self> {
        if year.len() != 4 {
            error!("Year too long. Invalid year");
            return Err(DBError::InvalidYear.into());
        }

        let client = Client::with_uri_str(Config::load().db_connection_string)
            .await
            .context("Failed to construct DB client")?;
        debug!("Attempting to ping db after initializing connection");
        client
            .database(&Config::load().database_name)
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
        // Only go back 12 months. We can infinitely check backwards, gotta stop somewhere
        let mut iteration = 0;
        info!(
            "Checking month {month} {collection_year}",
            collection_year = collection.name()
        );

        // flag to determine if we are looking for budgeting records in previous months
        let mut trying_prev_months = false;
        loop {
            debug!("Beginning of iteration {iteration}");
            match collection
                .find_one(doc! {
                    "month": month_to_check.to_string()
                })
                .await
                .context("Failed to perform db query")?
            {
                Some(mut month_spending) => {
                    info!("Found budget information in month {month_to_check}");
                    // If the found budget does not match the current month, then we need to clean up the spending history. Spending history must not be carried over. All other information should be carry over
                    if trying_prev_months {
                        debug!("Clearing out spending info");
                        month_spending.spending = vec![];
                        month_spending.total_spending = 0.0;
                        month_spending.over_budget_amount = 0.0;
                        // Also correct the month to the one being queried
                        month_spending.month = month;
                        month_spending.carried_over_from = Some(month_to_check);
                    }
                    debug!("Budget information: {:?}", month_spending);
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
                            trying_prev_months = true;
                            info!("There are no more months in current year to check. Checking previous year: {prev_collection_year}");

                            collection =
                                self.client
                                    .database(&Config::load().database_name)
                                    .collection::<MonthlyBudget>(&prev_collection_year.to_string());

                            month_to_check = Month::from_number(12).unwrap();
                        }
                    }
                    if iteration == 12 {
                        error!("Checked 12 months before target month. Assuming no budget information will be found");
                        return Err(DBError::BudgetNotFound);
                    }

                    iteration += 1;
                }
            }
        }
    }
}
#[derive(Error, Debug)]
pub enum DBError {
    /// There are no budget information found for the current budgeting period
    #[error("Budget not found")]
    BudgetNotFound,
    /// DB related errors
    // #[error("Database related erorrs: {0}")]
    // DB(#[from] mongodb::error::Error),
    /// Input is an invalid year
    #[error("Invalid year")]
    InvalidYear,
    /// Generic error
    #[error("Database related error: {0}")]
    DB(#[from] anyhow::Error),
}
/// Interface for database operations
pub struct DB {
    /// The DB client
    // TODO: consider removing this
    client: Client,
    /// The current collection of the current year to operate on
    pub collection: Collection<MonthlyBudget>,
}
