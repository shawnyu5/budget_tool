use std::fs;

use anyhow::{Context, Result};
use async_graphql::{EmptyMutation, EmptySubscription, Object, Schema, SimpleObject};
use base64::prelude::*;

use crate::config::Config;

/// The type of the graphql schema
pub type SchemaType = Schema<QueryRoot, EmptyMutation, EmptySubscription>;

/// Root of the graphql query
#[derive(Default, Clone)]
pub struct QueryRoot;

/// Frontend configuration
#[derive(Default, Clone, SimpleObject)]
pub struct FrontendConfig {
    /// Base 64 encoded public key used for encryption
    encryption_public_key: String,
    /// Non base 64 encoded VAPID public key used for sending notifications
    vapid_public_key: String,
}

#[Object]
/// Root of the query
impl QueryRoot {
    /// Configuration for the frontend to consume
    async fn config(&self) -> FrontendConfig {
        let backend_config = Config::load();

        FrontendConfig {
            encryption_public_key: BASE64_STANDARD.encode(backend_config.public_key),
            vapid_public_key: backend_config.vapid_public_key,
        }
    }
}

/// Generate the graphql schema, and save it to a file
pub fn generate_graphql_schema() -> Result<Schema<QueryRoot, EmptyMutation, EmptySubscription>> {
    let schema = Schema::build(QueryRoot, EmptyMutation, EmptySubscription).finish();

    fs::write("schema.graphql", schema.sdl()).context("Failed to write graphql schema to file")?;
    return Ok(schema);
}
