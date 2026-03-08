use crate::config::Config;
use crate::db::postgres::PostgresDB;
use crate::db::postgres::models::Year;
use crate::db::users::USER_TABLE_NAME;
use crate::graphql::error::GraphQlErrorObjectV2;
use crate::graphql::utils::extract_http_client;
use crate::models::Transaction;
use crate::utils::calculate_percentage;
use crate::{db::MongoDB, month::Month, monthly_budget::SpendingItem};
use anyhow::Context as AnhowContext;
use anyhow::Result;
use async_graphql::{Context, Enum, InputObject};
use async_graphql::{SimpleObject, Union};
use chrono::Utc;
use chrono_tz::America::New_York;
use firefly_client::models::{TransactionSplitStore, TransactionStore, TransactionTypeProperty};
use serde::Serialize;
use thiserror::Error;
use tracing::{error, info, instrument, warn};

#[derive(InputObject)]
pub struct AddTransactionV2Input {
    pub year: Year,
    pub month: Month,
    pub transaction: Transaction,
}

#[derive(SimpleObject)]
pub struct AddTransactionResponseV2 {
    success: bool,
}

#[instrument(skip_all)]
pub async fn add_transaction_v2(inputs: AddTransactionV2Input) -> Result<AddTransactionResponseV2> {
    dbg!(&inputs.transaction);
    let db = PostgresDB::new().await;
    db.insert_new_transaction(
        inputs.month,
        inputs.year,
        inputs.transaction.amount,
        inputs.transaction.date,
        inputs.transaction.description,
        inputs.transaction.notes,
    )
    .await
    .map_err(|e| {
        error!("{e:#?}");
        e
    })
    .context("Failed to insert transaction into DB")?;
    // TODO: add transaction in firefly
    Ok(AddTransactionResponseV2 { success: true })

    // let mut month_budget = budget_db
    //     .get_month_budget(inputs.month)
    //     .await
    //     .context("Failed to get monthly budget")?;

    // month_budget.spending.push(inputs.spending_item.clone());
    // month_budget.update_calculations();
    // month_budget.sort_by_date();
    //
    // info!("Updated budget: {:#?}", month_budget);
    // budget_db
    //     .update_monthly_budget(inputs.month, &month_budget)
    //     .await
    //     .context("Failed to save updated budget to DB")?;
    //
    // let user_db = MongoDB::new(USER_TABLE_NAME).await?;
    // let http_client = extract_http_client(ctx);
    // let dt_est = Utc::now().with_timezone(&New_York);
    // let rn = dt_est.to_rfc3339();
    //
    // let users = user_db
    //     .get_all_users()
    //     .await
    //     .context("Failed to get all users from DB")?;
    //
    // let config = Config::load();
    // let monthly_budget_config = month_budget.budget;
    //
    // for mut user in users {
    //     let mut amount = 0.0;
    //     if user.username == "shawn" {
    //         amount = calculate_percentage(
    //             inputs.spending_item.amount,
    //             monthly_budget_config.shawn_percentage_allocation,
    //         );
    //     } else if user.username == "maggie" {
    //         amount = calculate_percentage(
    //             inputs.spending_item.amount,
    //             monthly_budget_config.maggie_percentage_allocation,
    //         );
    //     } else {
    //         warn!(
    //             "Unsupported firefly user: {}. Not creating firefly transaction",
    //             user.username
    //         );
    //         continue;
    //     };
    //
    //     if user.firefly.is_none()
    //         || user
    //             .firefly
    //             .as_ref()
    //             .is_some_and(|firefly| !firefly.enabled)
    //     {
    //         continue;
    //     }
    //     user.decrypt_firefly_api_key()?;
    //     info!("Creating firefly transaction for user {}", &user.username);
    //     match firefly_client::apis::transactions_api::store_transaction(
    //         &firefly_client::apis::configuration::Configuration {
    //             base_path: config.firefly_url.clone(),
    //             client: http_client.clone(),
    //             bearer_access_token: user.firefly.clone().unwrap().api_key.clone(),
    //             ..Default::default()
    //         },
    //         TransactionStore {
    //             error_if_duplicate_hash: Some(false),
    //             apply_rules: Some(true),
    //             fire_webhooks: Some(true),
    //             group_title: None,
    //             transactions: vec![TransactionSplitStore {
    //                 r#type: TransactionTypeProperty::Withdrawal,
    //                 date: rn.clone(),
    //                 amount: amount.to_string(),
    //                 description: inputs.spending_item.clone().description,
    //                 notes: Some(Some(inputs.spending_item.clone().notes.unwrap_or_default())),
    //                 source_name: Some(Some(
    //                     user.firefly.unwrap().source_account.unwrap_or_default(),
    //                 )),
    //                 // source_name: Some(Some("Wealthsimple chequing".to_string())),
    //                 ..Default::default()
    //             }],
    //         },
    //         None,
    //     )
    //     .await
    //     {
    //         Ok(res) => res,
    //         Err(e) => {
    //             error!("{e:#?}");
    //             return Ok(AddTransactionResponseV2::GraphQLErrorObject(
    //                 GraphQlErrorObjectV2 {
    //                     code: AddSpendingItemByMonthError::FireflyUpdateFailed,
    //                     message: format!(
    //                         "Failed to create firfly transaction for user {}: {e}",
    //                         user.username
    //                     ),
    //                 },
    //             ));
    //         }
    //     };
    // }
    //
    // return Ok(AddTransactionResponseV2::SuccessResponse(
    //     AddTransactionV2SuccessResponse { success: true },
    // ));
}
