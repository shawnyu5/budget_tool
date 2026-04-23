use anyhow::{Context as _, Result};
use async_graphql::{Context, InputObject};
use rayon::iter::{IntoParallelRefIterator, ParallelIterator};
use rust_decimal::dec;
use tracing::{error, info, instrument};

use crate::{
    db::postgres::models::Year,
    graphql::{query::monthly_settings_v2::month_settings_v2, utils::extract_db_client},
    models::{HomePage, Settings, Transaction},
    month::Month,
};

#[derive(InputObject, Debug)]
pub struct HomePageV2Input {
    pub year: Year,
    pub month: Month,
}

pub async fn home_page_v2(ctx: &Context<'_>, inputs: HomePageV2Input) -> Result<HomePage> {
    let db = extract_db_client(ctx);
    let mut tx = db.transaction().await?;
    info!(
        "Getting settings for {year} {month}",
        year = inputs.year,
        month = inputs.month
    );
    // Settings route is responsible for handling carry budget allocation carry over.
    // If we dont call this first, total_allocation Calculatation will be incorrect
    // TODO: we should probs find a better way to handle carry over...
    let settings = month_settings_v2(ctx, inputs.year, inputs.month)
        .await
        .context("Failed to get month settings")
        .map_err(|e| {
            error!("{e:#?}");
            e
        })?;
    let settings = settings.settings;
    let total_spending = db
        .compute_total_spend(&mut tx, inputs.year, inputs.month)
        .await?;
    let total_budget = db
        .compute_total_allocation(&mut tx, inputs.year, inputs.month)
        .await?;

    // Calculate over spending amount
    let over_spending = {
        if total_spending <= total_budget {
            dec!(0)
        } else {
            total_spending - total_budget
        }
    };
    info!(
        "Getting transactions for {year} {month}",
        year = inputs.year,
        month = inputs.month
    );
    let transactions = db
        .get_transactions(&mut tx, inputs.year, inputs.month)
        .await?
        .par_iter()
        .map(|t| Transaction {
            id: t.id,
            amount: t.amount,
            date: t.date,
            description: t.description.clone().unwrap_or_default(),
            notes: t.notes.clone().unwrap_or_default(),
        })
        .collect();

    Ok(HomePage {
        total_spending,
        total_budget,
        over_spending,
        transactions,
        settings: Settings {
            total_allocation: settings.total_allocation,
            shawn_percentage_allocation: settings.shawn_percentage_allocation,
            shawn_contribution_amount: settings.shawn_contribution_amount,
            maggie_percentage_allocation: settings.maggie_percentage_allocation,
            maggie_contribution_amount: settings.maggie_contribution_amount,
            firefly: settings.firefly,
        },
    })
}
