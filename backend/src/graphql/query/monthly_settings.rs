use anyhow::{Context as _, Result};
use async_graphql::{Context, SimpleObject};
use tracing::error;

use crate::{
    db::postgres::{PostgresDB, models::Year},
    graphql::utils::extract_jwt,
    models::{FireflySettings, Settings},
    month::Month,
};

#[derive(SimpleObject)]
pub struct MonthlySettingsResponse {
    settings: Settings,
}

pub async fn month_settings(
    ctx: &Context<'_>,
    year: Year,
    month: Month,
) -> Result<MonthlySettingsResponse> {
    let jwt = extract_jwt(ctx)?;
    let db = PostgresDB::new().await;
    let current_user = db.get_user(&jwt.username).await?;
    let shawn_user = db.get_user("shawn").await?;
    let maggie_user = db.get_user("maggie").await?;
    let month_row = db
        .get_month(year, month)
        .await
        .map_err(|e| {
            error!("Failed to get month from DB: {:#?}", e);
            e
        })
        .context("failed to get month from DB")?;

    // // If no current month row, try the previous month
    // if month_row.is_none() {
    //     let month = {
    //         if month.to_number() == 1 {
    //             year -= 1;
    //             12
    //         } else {
    //             month.to_number() - 1
    //         }
    //     };
    // };

    let shawn_allocation = db
        .get_or_insert_budget_allocation(shawn_user.id, month_row.as_ref().unwrap().id)
        .await?;
    let maggie_allocation = db
        .get_or_insert_budget_allocation(maggie_user.id, month_row.as_ref().unwrap().id)
        .await?;
    let firefly = db.get_user_firefly_settings(current_user.id).await?;

    Ok(MonthlySettingsResponse {
        settings: Settings {
            total_allocation: db.compute_total_allocation(month_row.unwrap().id).await?,
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
