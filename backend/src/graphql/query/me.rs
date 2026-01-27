use anyhow::{Context as _, Result};
use async_graphql::Context;
use tracing::debug;

use crate::{
    db::{
        DB,
        users::{USER_TABLE_NAME, User},
    },
    graphql::utils::extract_jwt,
};

pub async fn me_handler(ctx: &Context<'_>) -> Result<User> {
    let jwt = extract_jwt(ctx)?;

    let db = DB::new(USER_TABLE_NAME)
        .await
        .context("Failed to connect to user table in DB")?;

    let mut user = db
        .get_user(&jwt.username)
        .await
        .context("Failed to get user from DB")?;

    user.decrypt_firefly_api_key()
        .context("Failed to decrypt firefly API key")?;

    debug!("User: {:#?}", user);
    return Ok(user);
}
