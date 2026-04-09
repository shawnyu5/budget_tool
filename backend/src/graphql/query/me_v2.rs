use anyhow::Context as _;
use anyhow::Result;
use async_graphql::Context;

use crate::{db::postgres::PostgresDB, graphql::utils::extract_jwt, models::User};

pub async fn me_v2_handler(ctx: &Context<'_>) -> Result<User> {
    let jwt = extract_jwt(ctx)?;
    let db = PostgresDB::new().await;
    let user = db
        .get_user(&jwt.username)
        .await
        .context("Failed to get user")?;

    return Ok(User {
        username: user.username,
    });
}
