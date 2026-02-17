use crate::{
    db::{
        MongoDB,
        users::{USER_TABLE_NAME, User},
    },
    graphql::utils::extract_jwt,
};
use anyhow::{Context as AnhowContext, Result};
use async_graphql::{Context, InputObject};
use tracing::{debug, info, instrument, warn};

#[derive(InputObject)]
pub struct SubscriptionInput {
    pub endpoint: String,
    pub p256dh: String,
    pub auth: String,
    pub expiration_time: Option<usize>,
}

#[instrument(skip_all)]
pub async fn save_subscription_handler(
    ctx: &Context<'_>,
    subscription: SubscriptionInput,
) -> Result<User> {
    let jwt = extract_jwt(ctx)?;
    info!("Saving user subscription");

    // Tracks if we are updating an existing user in the DB
    let mut existing_user = true;

    let db = MongoDB::new(USER_TABLE_NAME)
        .await
        .context("Failed to connect to DB")?;
    let mut user = db.get_user(&jwt.username).await.unwrap_or_else(|_| {
        warn!("User {} not found in DB. Creating new user", jwt.username);
        existing_user = false;
        User {
            username: jwt.username.clone(),
            ..Default::default()
        }
    });
    debug!("Found user: {:?}", user);

    user.notification_subscription.endpoint = subscription.endpoint;
    user.notification_subscription.keys.p256dh = subscription.p256dh;
    user.notification_subscription.keys.auth = subscription.auth;
    user.notification_subscription.expiration_time = subscription.expiration_time;

    let _result = db
        .save_user_info(&jwt.username, &user)
        .await
        .context("Failed to update subscription info")?;

    Ok(user)
}
