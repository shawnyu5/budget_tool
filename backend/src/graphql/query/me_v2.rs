use anyhow::Context as _;
use anyhow::Result;
use async_graphql::Context;

use crate::graphql::utils::extract_db_client;
use crate::{graphql::utils::extract_jwt, models::User};

pub async fn me_v2_handler(ctx: &Context<'_>) -> Result<User> {
    let jwt = extract_jwt(ctx)?;
    let db = extract_db_client(ctx);
    let user = db
        .get_user(&jwt.username)
        .await
        .context("Failed to get user")?;

    return Ok(User {
        username: user.username,
    });
}
