use anyhow::{Context as _, Result};
use async_graphql::{Context, SimpleObject};
use tracing::{error, info};

use crate::{
    config::Config,
    firefly::FireflyClient,
    graphql::utils::{extract_db_client, extract_jwt},
};

#[derive(SimpleObject)]
pub struct FireflyV2SuccessResponse {
    /// List of accounts this user has
    pub accounts: Vec<String>,
}

pub async fn firefly_v2(ctx: &Context<'_>) -> Result<Option<FireflyV2SuccessResponse>> {
    let jwt = extract_jwt(ctx)?;
    let db = extract_db_client(ctx);
    let mut tx = db.transaction().await?;
    let user = db
        .get_user(&jwt.username)
        .await
        .context("Failed to get user from DB")?;
    let firefly_settings = db
        .get_user_firefly_settings(&mut tx, user.id)
        .await
        .context("Failed to get user firefly settings")?;

    if !firefly_settings.enabled {
        info!("User has firefly integration disabled");
        return Ok(None);
    }

    let firefly_api_key = firefly_settings
        .decrypt_firefly_api_key()
        .context("Failed to decrypt user API key")?;

    let firefly_client = FireflyClient::new(&firefly_api_key, &Config::load().firefly_url);

    match firefly_client.list_firefly_accounts().await {
        Ok(accounts) => Ok(Some(FireflyV2SuccessResponse { accounts })),
        Err(e) => {
            error!("Failed to fetch Firefly user accounts: {e:#?}");
            ctx.add_error(async_graphql::ServerError::new(
                format!("Failed to fetch Firefly user accounts: {e}"),
                None,
            ));
            Ok(None)
        }
    }

    // Ok(Some(FireflyV2SuccessResponse { accounts }))
}
