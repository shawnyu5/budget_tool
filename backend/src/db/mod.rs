use mongodb::{Client, Collection};
use serde::de::DeserializeOwned;
use thiserror::Error;

mod monthly_budget;

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
