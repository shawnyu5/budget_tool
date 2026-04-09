use anyhow::anyhow;
use anyhow::Result;
use async_graphql::{Context, SimpleObject};
use tracing::error;

use crate::{
    config::Config,
    db::{MongoDB, users::USER_TABLE_NAME},
    graphql::utils::extract_jwt,
};

#[derive(SimpleObject)]
pub struct FireflySuccessResponse {
    /// List of accounts this user has
    pub accounts: Option<Vec<String>>,
}

pub async fn firefly_handler(ctx: &Context<'_>) -> Result<FireflySuccessResponse> {
    let jwt = extract_jwt(ctx)?;
    let user_db = MongoDB::new(USER_TABLE_NAME).await?;
    let mut user = user_db.get_user(&jwt.username).await?;
    let http_client = ctx.data::<reqwest::Client>().unwrap();
    let config = Config::load();

    if user.firefly.as_ref().is_some_and(|f| f.enabled) {
        user.decrypt_firefly_api_key()?;
        let accounts = match firefly_client::apis::accounts_api::list_account(
            &firefly_client::apis::configuration::Configuration {
                base_path: config.firefly_url,
                client: http_client.clone(),
                bearer_access_token: user.firefly.unwrap().api_key,
                ..Default::default()
            },
            None,
            Some(50),
            Some(1),
            None,
            None,
            None,
            Some(firefly_client::models::AccountTypeFilter::AssetAccount),
        )
        .await
        {
            Ok(a) => a,
            Err(e) => {
                error!("Failed to retrieve firefly user accounts: {:#?}", e);
                return Err(anyhow!("FIREFLY_ERROR"));
            }
        };

        let account_names = accounts
            .data
            .into_iter()
            .map(|a| a.attributes.name)
            .collect();

        return Ok(FireflySuccessResponse {
            accounts: Some(account_names),
        });
    }

    // If firefly is disabled, return an empty accounts array
    return Ok(FireflySuccessResponse { accounts: None });
}
