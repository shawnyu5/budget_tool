use sqlx::prelude::FromRow;
use uuid::Uuid;

/// A single user
#[derive(Debug, FromRow)]
pub struct User {
    pub id: Uuid,
    pub username: String,
}
