use anyhow::Context as _;
use async_graphql::{Context, InputObject, Result, SimpleObject};
use tracing::info;

use crate::graphql::utils::{extract_db_client, extract_jwt};

#[derive(InputObject)]
pub struct SaveSubscriptionV2input {
    pub endpoint: String,
    pub expiration_time: Option<String>,
    pub p256dh: String,
    pub auth: String,
}

#[derive(SimpleObject)]
pub struct SaveSubscriptionV2Response {
    pub success: bool,
}

pub async fn save_subscription_v2(
    ctx: &Context<'_>,
    inputs: SaveSubscriptionV2input,
) -> Result<SaveSubscriptionV2Response> {
    let jwt = extract_jwt(ctx).context("Failed to extract JWT")?;
    let db = extract_db_client(ctx);
    let mut tx = db
        .transaction()
        .await
        .context("Failed to start transaction")?;
    let username = jwt.username;

    info!("Saving user subscription for user {username}");
    db.update_user_notification_subscription(
        &mut tx,
        &username,
        &inputs.endpoint,
        inputs.expiration_time,
        &inputs.p256dh,
        &inputs.auth,
    )
    .await
    .context("Failed to get user notification_subscription")?;

    Ok(SaveSubscriptionV2Response { success: true })
}
