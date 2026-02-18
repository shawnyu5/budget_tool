use anyhow::{Context as AnyhowContext, Result};
use async_graphql::{Context, InputObject, SimpleObject, Union};
use reqwest::header::ACCEPT;
use tracing::{error, info};

use crate::config::Config;
use crate::{
    db::{
        DB,
        users::{FireflySettings, USER_TABLE_NAME},
    },
    graphql::{
        error::{GraphQLErrorCode, GraphQLErrorObject},
        utils::extract_jwt,
    },
    month::Month,
    monthly_budget::BudgetConfig,
};

#[derive(InputObject)]
pub struct UpdateBudgetConfigInput {
    /// The year of the budget to update
    pub year: i32,
    /// The month of the budget to update
    pub month: Month,
    /// The new budget config
    pub budget_config: BudgetConfig,
    /// Firefly related settings for the current user
    pub firefly: FireflySettings,
}

#[derive(Union)]
pub enum UpdateBudgetConfigResponse {
    Response(UpdateBudgetResponse),
    Error(GraphQLErrorObject),
}

#[derive(SimpleObject)]
pub struct UpdateBudgetResponse {
    pub success: bool,
}

#[derive(Union)]
pub enum MonthlyBudgetConfigResponse {
    MonthlyBudgetConfig(BudgetConfig),
    Error(GraphQLErrorObject),
}

pub async fn update_budget_config_handler(
    ctx: &Context<'_>,
    mut inputs: UpdateBudgetConfigInput,
) -> Result<UpdateBudgetConfigResponse> {
    let jwt = extract_jwt(ctx)?;

    let monthly_budget_db = DB::new(&inputs.year.to_string())
        .await
        .context("Failed to connect to database")?;
    let mut month_budget = monthly_budget_db
        .get_month_budget(inputs.month)
        .await
        .context("Failed to get month budget")?;

    month_budget.budget = inputs.budget_config;
    // budget.update_calculations();
    monthly_budget_db
        .update_monthly_budget(inputs.month, &month_budget)
        .await
        .context("Failed to update budget")?;

    let user_db = DB::new(USER_TABLE_NAME).await?;
    let mut user = user_db
        .get_user(&jwt.username)
        .await
        .context("Failed to get user")?;

    if inputs.firefly.enabled
        && let Some(api_key) = (inputs.firefly.api_key.as_mut())
    {
        let mut headers = reqwest::header::HeaderMap::new();
        headers.insert(
            ACCEPT,
            reqwest::header::HeaderValue::from_static("application/json"),
        );
        let client = reqwest::Client::builder()
            .default_headers(headers)
            .build()
            .unwrap();
        match firefly_client::apis::about_api::get_current_user(
            &firefly_client::apis::configuration::Configuration {
                base_path: Config::load().firefly_url,
                // bearer_access_token: Some("hello".to_string()),
                bearer_access_token: Some(api_key.to_string()),
                client,
                ..Default::default()
            },
            None,
        )
        .await
        {
            Ok(_) => {}
            Err(e) => {
                error!("Failed to talk to firfly: {e}");
                return Ok(UpdateBudgetConfigResponse::Error(GraphQLErrorObject {
                    code: GraphQLErrorCode::InvalidFireflyAPIKey,
                    message: "Failed to talk to firfly. Please check your API key".to_string(),
                }));
            }
        };

        info!("Encrypting API key");
        user.encrypt_firefly_api_key(api_key)
            .context("Failed to encrypt firefly API key while updating user settings")?;

        info!(
            "Encrypted API key: {:?}",
            &user.firefly.clone().unwrap().api_key
        );
    }

    let _ = user_db
        .save_user_info(&jwt.username, &user)
        .await
        .context("Failed to update user firefly settings");
    return Ok(UpdateBudgetConfigResponse::Response(UpdateBudgetResponse {
        success: true,
    }));
}
