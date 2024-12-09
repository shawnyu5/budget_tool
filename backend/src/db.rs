use anyhow::{Context, Result};
use chrono::{Datelike, Utc};
use mongodb::{bson::doc, Client, Collection, Database};
use serde::{Deserialize, Serialize};
use tracing::debug;
use utoipa::ToSchema;

use crate::config::Config;

/// Interface for database operations
pub struct DB {
    /// The DB client
    pub client: Client,
    /// The current collection of the current year to operate on
    pub collection: Collection<MonthlySpending>,
}

impl DB {
    /// Creates a new db connection
    pub async fn new() -> Result<Self> {
        let client = Client::with_uri_str(Config::load().db_connection_string).await?;
        debug!("Attempting to ping db after initializing connection");
        client
            .database("budget_tool")
            .run_command(doc! { "ping": 1 })
            .await
            .context("Failed to ping db")?;
        debug!("Pinging successful");

        let year = Utc::now().year();
        let collection = client
            .database("budget_tool")
            .collection::<MonthlySpending>(year.to_string().as_str());
        debug!("Setting collection to db budget_tool, in collection {year}");

        return Ok(Self { client, collection });
    }
}

/// The budget for an entire year, split into months
#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct YearlyBudget {
    pub months: Vec<MonthlySpending>,
}

/// Budgeting details for a month, including:
/// - The allocated budget, and the percentage split
/// - The monthly spending
#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct MonthlySpending {
    pub month: String,
    pub budget: Budget,
    pub spending: Vec<Spending>,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct Budget {
    pub total: i64,
    #[serde(rename = "shawn_percentage_allocation")]
    pub shawn_percentage_allocation: i64,
    #[serde(rename = "maggie_percentage_allocation")]
    pub maggie_percentage_allocation: i64,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct Spending {
    pub amount: i64,
    pub date: String,
    pub description: String,
    pub notes: String,
}
