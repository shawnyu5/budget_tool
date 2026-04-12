use anyhow::{Context as _, Result};
use async_graphql::{Context, SimpleObject};

use crate::{
    config::Config, db::postgres::PostgresDB, firefly::FireflyClient, graphql::utils::extract_jwt,
};

#[derive(SimpleObject)]
pub struct FireflyV2SuccessResponse {
    /// List of accounts this user has
    pub accounts: Vec<String>,
}

pub async fn firefly_v2(ctx: &Context<'_>) -> Result<FireflyV2SuccessResponse> {
    let jwt = extract_jwt(ctx)?;
    let db = PostgresDB::new().await;
    let mut tx = db.transaction().await?;
    let user = db
        .get_user(&jwt.username)
        .await
        .context("Failed to get user from DB")?;
    let firefly_settings = db
        .get_user_firefly_settings(&mut tx, user.id)
        .await
        .context("Failed to get user firefly settings")?;

    if firefly_settings.api_key.is_none() {
        return Ok(FireflyV2SuccessResponse { accounts: vec![] });
    }

    let firefly_api_key = firefly_settings
        .decrypt_firefly_api_key()
        .context("Failed to decrypt user API key")?;

    let firefly_client = FireflyClient::new(&firefly_api_key, &Config::load().firefly_url);

    let accounts = firefly_client
        .list_accounts()
        .await
        .context("Failed to get accounts for user from firefly")?;

    Ok(FireflyV2SuccessResponse { accounts })
}
