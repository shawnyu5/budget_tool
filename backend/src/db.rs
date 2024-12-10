use anyhow::{anyhow, Context, Result};
use chrono::{Datelike, Utc};
use mongodb::{bson::doc, Client, Collection, Database};
use serde::{Deserialize, Serialize};
use tracing::debug;
use utoipa::ToSchema;

use crate::config::Config;

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
            return Err(anyhow!("Invalid year"));
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
}

// /// The budget for an entire year, split into months
// #[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize, ToSchema)]
// #[serde(rename_all = "camelCase")]
// pub struct YearlyBudget {
//     pub months: Vec<MonthlySpending>,
// }

/// Budget details for single month
#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct MonthlyBudget {
    /// The month
    pub month: String,
    /// Budget details
    pub budget: Budget,
    /// List of spent items
    pub spending: Vec<Spending>,
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

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct Spending {
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
