use anyhow::anyhow;
use anyhow::{Context as _, Result};
use async_graphql::{Context, Union};
use tracing::{debug, info};

use crate::{
    db::{
        DB,
        users::{USER_TABLE_NAME, User},
    },
    encryption::decrypt,
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

    if let Some(firefly) = user.firefly.as_mut()
        && firefly.enabled
        && let (Some(api_key), Some(nonce)) =
            (firefly.api_key.as_mut(), firefly.encryption_nounce.as_ref())
    {
        info!("Decrypting API key...");
        let decrypted =
            decrypt(api_key, nonce).map_err(|e| anyhow!("Failed to decrypt API key: {e}"))?;

        *api_key = decrypted;
    }

    debug!("User: {:#?}", user);
    return Ok(user);
}
