use anyhow::{Context as AnhowContext, Result};
use async_graphql::{Context, InputObject, Object};
use tracing::{debug, info, instrument, warn};

use crate::{
    db::{
        users::{User, USER_TABLE_NAME},
        DB,
    },
    routes::JwtClaim,
};

/// Root of the Mutation
#[derive(Default, Clone, Debug)]
pub struct MutationRoot;

#[derive(InputObject)]
pub struct SubscriptionInput {
    pub endpoint: String,
    pub p256dh: String,
    pub auth: String,
    pub expiration_time: Option<usize>,
}

#[Object]
impl MutationRoot {
    /// Save a notification subscription for a user
    /// The user is extracted from the JWT
    #[instrument(skip_all)]
    async fn save_subscription(
        &self,
        ctx: &Context<'_>,
        subscription: SubscriptionInput,
    ) -> Result<User> {
        info!("Saving user subscription");
        let jwt = ctx
            .data::<JwtClaim>()
            .expect("There should always be a JWT here!");

        // Tracks if we are updating an existing user in the DB
        let mut existing_user = true;

        let db = DB::new(USER_TABLE_NAME)
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
            .save_user_info(&user)
            .await
            .context("Failed to update subscription info")?;

        Ok(user)
    }
}
