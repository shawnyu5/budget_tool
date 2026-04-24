use async_graphql::InputObject;
use sqlx::prelude::FromRow;
use uuid::Uuid;

/// A single user
#[derive(Debug, FromRow, InputObject, Clone)]
pub struct UserRow {
    pub id: Uuid,
    pub username: String,
}
