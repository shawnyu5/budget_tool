use anyhow::Result;
use async_graphql::InputObject;
use sqlx::prelude::FromRow;
use tracing::instrument;
use uuid::Uuid;

/// A single user
#[derive(Debug, FromRow, InputObject)]
#[graphql(input_name = "UserV2")]
pub struct UserRow {
    pub id: Uuid,
    pub username: String,
}

impl UserRow {}
