use std::fs;

use anyhow::{Context, Result};
use async_graphql::{EmptyMutation, EmptySubscription, Object, Schema, SimpleObject};

use crate::tgtg::response::TGTGItems;

#[derive(Default)]
struct Query {
    tgtg: Tgtg,
}

#[Object]
impl Query {
    async fn tgtg(&self) -> &Tgtg {
        &self.tgtg
    }
}

#[derive(Default)]
struct Tgtg {
    items: TGTGItems,
}

#[Object]
impl Tgtg {
    async fn items(&self) -> TGTGItems {
        return TGTGItems::default();
    }
}

/// Generate the graphql schema, and save it to a file
pub fn generate_graphql_schema() -> Result<String> {
    let schema = Schema::build(Query::default(), EmptyMutation, EmptySubscription)
        .finish()
        .sdl();

    fs::write("schema.graphql", &schema).context("Failed to write graphql schema to file")?;
    return Ok(schema);
}
