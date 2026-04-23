use anyhow::{Context as _, Result};
use async_graphql::{InputObject, SimpleObject};
use chrono::DateTime;
use firefly_client::models::{TransactionSplitUpdate, TransactionUpdate};
use rust_decimal::Decimal;
use tracing::{error, info, warn};
use uuid::Uuid;

use crate::{config::Config, db::postgres::PostgresDB, firefly::FireflyClient};

#[derive(InputObject, Debug)]
pub struct UpdateTransactionByIdV2Input {
    pub transaction_id: Uuid,
    pub amount: Decimal,
    pub date: DateTime<chrono::FixedOffset>,
    pub description: Option<String>,
    pub notes: Option<String>,
}

#[derive(SimpleObject)]
pub struct UpdateTransactionByIdV2Response {
    pub success: bool,
}

pub async fn update_transaction_by_id_v2(
    inputs: UpdateTransactionByIdV2Input,
) -> Result<UpdateTransactionByIdV2Response> {
    let db = PostgresDB::new().await;
    let mut tx = db.transaction().await?;
    info!("Updating transaction in DB");
    let transaction_row = db
        .update_transaction_by_id(
            &mut tx,
            inputs.transaction_id,
            inputs.amount,
            inputs.date,
            inputs.description.as_deref(),
            inputs.notes.as_deref(),
        )
        .await
        .context("Failed to update transaction in DB")?;

    info!("Calculating transaction split");
    let (shawn_split, maggie_split) = match transaction_row
        .split_transaction(&mut tx)
        .await
        .context("Failed to split transaction")?
    {
        Some(s) => s,
        None => {
            warn!(
                "Unable to split transaction. This transaction was most likely migrated from Mongo DB. Skip updating Firefly transaction"
            );
            return Ok(UpdateTransactionByIdV2Response { success: true });
        }
    };

    let firefly_transactions = db
        .get_firfly_transactions(&mut tx, inputs.transaction_id)
        .await
        .context("Failed to get Firefly transaction from DB")?;

    for firefly_transaction in firefly_transactions {
        info!("Found Firefly transaction in DB: {firefly_transaction:?}. Updating Firefly");
        let config = Config::load();
        let core_users = db
            .get_core_users(&mut tx)
            .await
            .context("Failed to get core users")?;

        for user in core_users {
            let firefly_settings = db
                .get_user_firefly_settings(&mut tx, user.id)
                .await
                .context("Failed to get user from DB")?;
            if !firefly_settings.enabled {
                info!(
                    "{} does not have Firefly integration enabled. Skipping",
                    user.username
                );
                continue;
            }

            let firefly_api_key = firefly_settings
                .decrypt_firefly_api_key()
                .context("Failed to decrypt Firefly API key")?;

            let firefly_client = FireflyClient::new(&firefly_api_key, &config.firefly_url);
            if user.username == "shawn" {
                info!("Updating Shawn Firefly transaction");
                firefly_client
                    .update_transaction_by_id(
                        &firefly_transaction.firefly_id,
                        firefly_client::models::TransactionUpdate {
                            apply_rules: Some(true),
                            fire_webhooks: Some(true),
                            group_title: None,
                            transactions: Some(vec![TransactionSplitUpdate {
                                r#type: Some(
                                    firefly_client::models::TransactionTypeProperty::Withdrawal,
                                ),
                                amount: Some(shawn_split.to_string()),
                                description: transaction_row.description.clone(),
                                ..Default::default()
                            }]),
                        },
                    )
                    .await
                    .context("Failed to update Shawn Firefly transaction")?;
            } else if user.username == "maggie" {
                info!("Updating Maggie Firefly transaction");
                firefly_client
                    .update_transaction_by_id(
                        &firefly_transaction.firefly_id,
                        firefly_client::models::TransactionUpdate {
                            apply_rules: Some(true),
                            fire_webhooks: Some(true),
                            group_title: None,
                            transactions: Some(vec![TransactionSplitUpdate {
                                r#type: Some(
                                    firefly_client::models::TransactionTypeProperty::Withdrawal,
                                ),
                                amount: Some(maggie_split.to_string()),
                                description: transaction_row.description.clone(),
                                ..Default::default()
                            }]),
                        },
                    )
                    .await
                    .context("Failed to update Maggie Firefly transaction")?;
            }
        }
    }

    tx.commit().await.context("Failed to commit transaction")?;

    return Ok(UpdateTransactionByIdV2Response { success: true });
}
