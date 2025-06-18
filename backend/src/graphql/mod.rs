use std::fs;

use anyhow::{Context, Result};
use async_graphql::{EmptySubscription, Schema};
use tracing::info;

use crate::graphql::{mutation::MutationRoot, query::QueryRoot};

mod mutation;
mod query;

/// The type of the graphql schema
pub type SchemaType = Schema<QueryRoot, MutationRoot, EmptySubscription>;

/// Generate the graphql schema, and save it to a file
pub fn generate_graphql_schema() -> Result<SchemaType> {
    let schema = Schema::build(QueryRoot, MutationRoot, EmptySubscription).finish();
    fs::write("schema.graphql", schema.sdl()).context("Failed to write graphql schema to file")?;
    info!("Generated graphql schema");
    return Ok(schema);
}
