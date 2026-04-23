use anyhow::anyhow;
use anyhow::{Context as _, Result};
use async_graphql::{Context, InputObject, SimpleObject};
use tracing::{error, info};

use crate::db::postgres::models::Year;
use crate::encryption::encrypt;
use crate::firefly::FireflyClient;
use crate::{
    config::Config, db::postgres::PostgresDB, graphql::utils::extract_jwt, models::Settings,
    month::Month,
};

#[derive(InputObject, Debug)]
pub struct UpdateMonthSettingsInput {
    /// The year of the budget to update
    pub year: Year,
    /// The month of the budget to update
    pub month: Month,
    /// Updated settings
    pub settings: Settings,
}

#[derive(SimpleObject)]
pub struct UpdateMonthSettingsResponse {
    pub success: bool,
}

pub async fn update_month_settings(
    ctx: &Context<'_>,
    mut inputs: UpdateMonthSettingsInput,
) -> Result<UpdateMonthSettingsResponse> {
    let jwt = extract_jwt(ctx)?;
    let db = PostgresDB::new().await;
    let mut tx = db.transaction().await?;
    let current_user = db
        .get_user(&jwt.username)
        .await
        .context("Failed to fetch user")?;
    let core_users = db.get_core_users(&mut tx).await?;
    let mut encryption_nounce = "".to_string();

    if inputs.settings.firefly.enabled {
        let firefly_client = FireflyClient::new(
            &inputs.settings.firefly.api_key.clone().unwrap(),
            &Config::load().firefly_url,
        );

        info!("Testing user Firefly API key");
        match firefly_client.list_accounts().await {
            Ok(_) => {}
            Err(e) => {
                error!("Failed to talk to firfly: {e}");
                return Err(anyhow!(
                    "Invalid API key. Failed to talk to Firefly using API key"
                ));
            }
        };

        info!("Firefly API key is valid");
        info!("Encrypting API key");
        let (secret, b64_nounce) =
            encrypt(&inputs.settings.firefly.api_key.clone().unwrap_or_default())
                .map_err(|e| anyhow!("Failed to encrypt API key: {e}"))?;
        inputs.settings.firefly.api_key = Some(secret);
        encryption_nounce = b64_nounce.to_owned();
    }

    db.update_user_firefly_settings(
        &mut tx,
        current_user.id,
        inputs.settings.firefly.enabled,
        inputs.settings.firefly.api_key,
        Some(encryption_nounce.to_string()),
        inputs.settings.firefly.source_account,
    )
    .await
    .context("Failed to update user firefly settings")?;

    for user in core_users {
        if user.username == "shawn" {
            info!("Updating budget allocation for user Shawn");
            db.update_budget_allocation(
                &mut *tx,
                inputs.year,
                inputs.month,
                user.id,
                inputs.settings.shawn_percentage_allocation,
                inputs.settings.shawn_contribution_amount,
            )
            .await?
        } else if user.username == "maggie" {
            info!("Updating budget allocation for user Maggie");
            db.update_budget_allocation(
                &mut *tx,
                inputs.year,
                inputs.month,
                user.id,
                inputs.settings.maggie_percentage_allocation,
                inputs.settings.maggie_contribution_amount,
            )
            .await?
        };
    }

    tx.commit().await.context("Failed to commit transaction")?;
    Ok(UpdateMonthSettingsResponse { success: true })
}
