use std::time::Duration;

use anyhow::Context;
use anyhow::Result;
use mongodb::options::ClientOptions;
use mongodb::{Client, Collection, bson::doc};
use serde::de::DeserializeOwned;
use thiserror::Error;
use tracing::debug;
use tracing::info;

use crate::config::Config;

mod monthly_budget;
pub mod users;

/// Interface for database operations
pub struct DB<T: std::marker::Send + std::marker::Sync + DeserializeOwned> {
    /// The DB client
    client: Client,
    /// The current collection of the current year to operate on
    pub collection: Collection<T>,
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
    /// Generic error
    #[error("Database related error: {0}")]
    DB(#[from] anyhow::Error),
}

impl<T: std::marker::Send + std::marker::Sync + DeserializeOwned> DB<T> {
    /// Creates a new db connection
    ///
    /// * `name`: name of the collection to connect to
    pub async fn new(name: &str) -> Result<Self> {
        let mut client_opts = ClientOptions::parse(Config::load().db_connection_string)
            .await
            .context("Failed to parse mongo DB url")?;
        client_opts.connect_timeout = Some(Duration::from_secs(10));
        info!("Initializing DB client for {name} collection");

        let client = Client::with_options(client_opts).context("Failed to construct DB client")?;
        // let client = Client::with_uri_str(Config::load().db_connection_string)
        // .await
        // .context("Failed to construct DB client")?;
        debug!("Attempting to ping db after initializing connection");
        client
            .database(&Config::load().database_name)
            .run_command(doc! { "ping": 1 })
            .await
            .context("Failed to ping db")?;
        debug!("Pinging successful");

        let collection = client
            .database(&Config::load().database_name)
            .collection::<T>(name);
        debug!(
            "Setting collection to db {db_name}, in collection {name}",
            db_name = &Config::load().database_name
        );

        return Ok(Self { client, collection });
    }
}
