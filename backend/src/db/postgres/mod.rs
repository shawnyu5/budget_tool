use sqlx::{Pool, Postgres, postgres::PgPoolOptions};

use crate::config::Config;

pub mod models;

/// Interface for database operations with Postgres
pub struct PostgresDB {
    pool: Pool<Postgres>,
}

impl PostgresDB {
    /// Connect to a new DB
    pub async fn new() -> Self {
        let config = Config::load();
        let pool = PgPoolOptions::new()
            .max_connections(5)
            .connect(&config.postgres_url)
            .await
            .expect("Failed to connect to Postgres DB");

        Self { pool }
    }
}
