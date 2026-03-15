use anyhow::{Context as _, Result};
use async_graphql::{Context, SimpleObject};

use crate::{
    db::postgres::models::Year,
    graphql::utils::{extract_db_client, extract_jwt},
    models::{FireflySettings, Settings},
    month::Month,
};

#[derive(SimpleObject)]
pub struct MonthlySettingsResponse {
    pub settings: Settings,
}

pub async fn month_settings_v2(
    ctx: &Context<'_>,
    year: Year,
    month: Month,
) -> Result<MonthlySettingsResponse> {
    let jwt = extract_jwt(ctx)?;
    let db = extract_db_client(ctx);
    let mut tx = db.transaction().await?;
    let current_user = db.get_user(&jwt.username).await?;
    let shawn_user = db.get_user("shawn").await?;
    let maggie_user = db.get_user("maggie").await?;

    let month_row = db
        .get_or_insert_month(&mut tx, year, month)
        .await
        .context("Failed to get or insert month")?;

    let shawn_allocation = db
        .get_or_insert_budget_allocation(&mut tx, year, month_row.month, shawn_user.id)
        .await?;
    let maggie_allocation = db
        .get_or_insert_budget_allocation(&mut tx, year, month_row.month, maggie_user.id)
        .await?;
    let firefly = db.get_user_firefly_settings(current_user.id).await?;

    tx.commit().await.context("Failed to commit transaction")?;
    Ok(MonthlySettingsResponse {
        settings: Settings {
            total_allocation: db.compute_total_allocation(year, month_row.month).await?,
            shawn_percentage_allocation: shawn_allocation.percentage_allocation,
            shawn_contribution_amount: shawn_allocation.contribution_amount,
            maggie_percentage_allocation: maggie_allocation.percentage_allocation,
            maggie_contribution_amount: maggie_allocation.contribution_amount,
            firefly: FireflySettings {
                enabled: firefly.enabled,
                api_key: firefly.api_key,
                source_account: firefly.source_account,
            },
        },
    })
}
