use anyhow::Context as _;
use anyhow::Result;
use sqlx::PgConnection;
use sqlx::query;
use sqlx::query_as;
use tracing::instrument;
use uuid::Uuid;

use crate::db::postgres::PostgresDB;
use crate::db::postgres::models::user::UserRow;

impl PostgresDB {
    /// Get a user by their username
    #[instrument(skip_all)]
    pub async fn get_user(&self, username: &str) -> Result<UserRow> {
        let user = query_as!(
            UserRow,
            "
            SELECT * FROM users
            WHERE username = $1
            ",
            username
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(user)
    }
    /// Update an existing user
    #[instrument(skip_all)]
    pub async fn update_user(&self, user_id: Uuid, username: &str) -> Result<()> {
        query!(
            "
        UPDATE users
        SET username = $1
        WHERE id = $2
        ",
            username,
            user_id
        )
        .execute(&self.pool)
        .await
        .context("Failed to update user")?;

        Ok(())
    }

    /// Fetch the core users (Shawn + Maggie) of the system from the DB
    pub async fn get_core_users(&self, executor: &mut PgConnection) -> Result<Vec<UserRow>> {
        let users = query_as!(
            UserRow,
            "
            SELECT * FROM users
            WHERE username = $1 OR username = $2
            ",
            "shawn",
            "maggie"
        )
        .fetch_all(executor)
        .await?;

        assert_eq!(
            users.len(),
            2,
            "There should be no more than 2 core users fetched from DB"
        );

        Ok(users)
    }
}
