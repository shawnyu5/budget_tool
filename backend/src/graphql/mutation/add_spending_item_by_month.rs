use crate::config::Config;
use crate::db::users::USER_TABLE_NAME;
use crate::graphql::error::{GraphQLErrorObject, GraphQlErrorObjectV2};
use crate::graphql::utils::extract_jwt;
use crate::utils::calculate_percentage;
use crate::{db::DB, month::Month, monthly_budget::SpendingItem};
use anyhow::Context as AnhowContext;
use anyhow::Result;
use async_graphql::{Context, Enum, InputObject};
use async_graphql::{SimpleObject, Union};
use chrono::{DateTime, Utc};
use firefly_client::models::{TransactionSplitStore, TransactionStore, TransactionTypeProperty};
use serde::Serialize;
use thiserror::Error;
use tracing::{error, info, instrument, warn};

#[derive(InputObject)]
pub struct AddSpendingItemByMonthInput {
    pub year: String,
    pub month: Month,
    pub spending_item: SpendingItem,
}

#[derive(Union)]
pub enum AddSpendingItemByMonthResponse {
    SuccessResponse(SuccessResponse),
    GraphQLErrorObject(GraphQlErrorObjectV2<AddSpendingItemByMonthError>),
}

#[derive(SimpleObject)]
pub struct SuccessResponse {
    pub success: bool,
}

/// Errors that could happen during adding an item by month
#[derive(Enum, Copy, Clone, Eq, PartialEq, Debug, Error, Serialize)]
pub enum AddSpendingItemByMonthError {
    /// Failed to create / update transactions in firefly
    #[error("Failed to update firefly")]
    FireflyUpdateFailed,
}

#[instrument(skip_all)]
pub async fn add_spending_item_by_month_handler(
    ctx: &Context<'_>,
    inputs: AddSpendingItemByMonthInput,
) -> Result<AddSpendingItemByMonthResponse> {
    let jwt = extract_jwt(ctx)?;

    let budget_db = DB::new(inputs.year.as_str())
        .await
        .context("Failed to connect to DB")?;

    let mut month_budget = budget_db
        .get_month_budget(inputs.month)
        .await
        .context("Failed to get monthly budget")?;

    month_budget.spending.push(inputs.spending_item.clone());
    month_budget.update_calculations();

    info!("Updated budget: {:#?}", month_budget);
    budget_db
        .update_monthly_budget(inputs.month, &month_budget)
        .await
        .context("Failed to save updated budget to DB")?;

    let user_db = DB::new(USER_TABLE_NAME).await?;
    let mut user = user_db
        .get_user(&jwt.username)
        .await
        .context("Failed to get user info from DB")?;

    if user.firefly.as_ref().is_some_and(|f| f.enabled) {
        user.decrypt_firefly_api_key()
            .context("Failed to decrypt user firefly API key")?;
        let client = ctx.data::<reqwest::Client>().unwrap();

        let dt: DateTime<Utc> = Utc::now()
            .date_naive()
            .and_hms_opt(0, 0, 0)
            .unwrap()
            .and_utc();

        let rn = dt.to_rfc3339();

        let users = user_db
            .get_all_users()
            .await
            .context("Failed to get all users from DB")?;

        let config = Config::load();
        let db = DB::new(&inputs.year.to_string()).await.unwrap();
        let monthly_budget_config = db
            .get_month_budget(inputs.month)
            .await
            .context("Failed to get monthly budget config from DB")?
            .budget;
        for mut user in users {
            let mut amount = 0.0;
            if user.username == "shawn" {
                amount = calculate_percentage(
                    inputs.spending_item.amount,
                    monthly_budget_config.shawn_percentage_allocation,
                );
            } else if user.username == "maggie" {
                amount = calculate_percentage(
                    inputs.spending_item.amount,
                    monthly_budget_config.maggie_percentage_allocation,
                );
            } else {
                warn!(
                    "Unsupported firefly user: {}. Not creating firefly transaction",
                    user.username
                );
                continue;
            };

            user.decrypt_firefly_api_key()?;
            info!("Creating firefly transaction for user {}", &user.username);
            match firefly_client::apis::transactions_api::store_transaction(
                &firefly_client::apis::configuration::Configuration {
                    base_path: config.firefly_url.clone(),
                    client: client.clone(),
                    bearer_access_token: user.firefly.unwrap().api_key.clone(),
                    ..Default::default()
                },
                TransactionStore {
                    error_if_duplicate_hash: Some(false),
                    apply_rules: Some(true),
                    fire_webhooks: Some(true),
                    group_title: None,
                    transactions: vec![TransactionSplitStore {
                        r#type: TransactionTypeProperty::Withdrawal,
                        date: rn.clone(),
                        amount: amount.to_string(),
                        description: inputs.spending_item.clone().description,
                        notes: Some(inputs.spending_item.clone().notes),
                        // TODO: this should be configurable
                        source_name: Some(Some("Wealthsimple chequing".to_string())),
                        ..Default::default()
                    }],
                },
                None,
            )
            .await
            {
                Ok(res) => res,
                Err(e) => {
                    error!("{e:#?}");
                    return Ok(AddSpendingItemByMonthResponse::GraphQLErrorObject(
                        GraphQlErrorObjectV2 {
                            code: AddSpendingItemByMonthError::FireflyUpdateFailed,
                            message: format!(
                                "Failed to create firfly transaction for user {}: {e}",
                                user.username
                            ),
                        },
                    ));
                }
            };
        }
    }

    return Ok(AddSpendingItemByMonthResponse::SuccessResponse(
        SuccessResponse { success: true },
    ));
}
