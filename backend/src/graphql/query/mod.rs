use anyhow::Result;
use async_graphql::{Context, Object};
use tracing::instrument;

use crate::{
    db::users::User,
    graphql::{
        mutation::{
            MonthlyBudgetResponse, update_monthly_budget_config::MonthlyBudgetConfigResponse,
        },
        query::{
            config::{FrontendConfig, config_handler},
            firefly::{FireflyResponse, firefly_handler},
            me::me_handler,
            monthly_budget::monthly_budget_handler,
            monthly_budget_config::monthly_budget_config_handler,
            spending_item::{SearchSpendingItemInput, search_spending_item_handler},
        },
        utils::AuthGuard,
    },
    month::Month,
    monthly_budget::SpendingItem,
};

mod config;
pub mod firefly;
mod me;
mod month_settings;
mod monthly_budget;
mod monthly_budget_config;
pub mod spending_item;

/// Root of the graphql query
#[derive(Default, Clone, Debug)]
pub struct QueryRoot;

#[Object]
/// Root of the query
impl QueryRoot {
    /// Configuration for the frontend to consume
    #[instrument(skip_all)]
    async fn config(&self) -> FrontendConfig {
        config_handler().await
    }

    /// Get the budget for a specific month in a year
    ///
    /// * `year`: the year
    /// * `month`: the month
    #[instrument(skip_all)]
    #[graphql(guard = "AuthGuard")]
    async fn monthly_budget(
        &self,
        ctx: &Context<'_>,
        year: u16,
        month: Month,
    ) -> MonthlyBudgetResponse {
        monthly_budget_handler(ctx, year, month).await
    }

    #[instrument(skip_all)]
    #[graphql(guard = "AuthGuard")]
    async fn monthly_budget_config(
        &self,
        ctx: &Context<'_>,
        year: u16,
        month: Month,
    ) -> MonthlyBudgetConfigResponse {
        monthly_budget_config_handler(ctx, year, month).await
    }

    #[instrument(skip_all)]
    #[graphql(guard = "AuthGuard")]
    async fn me(&self, ctx: &Context<'_>) -> Result<User> {
        me_handler(ctx).await
    }

    #[instrument(skip_all)]
    #[graphql(guard = "AuthGuard")]
    /// Retrieve information from Firefly it self
    async fn firefly(&self, ctx: &Context<'_>) -> Result<FireflyResponse> {
        firefly_handler(ctx).await
    }

    #[instrument(skip_all)]
    #[graphql(guard = "AuthGuard")]
    /// Search for a spending item by time and ID
    pub async fn search_spending_item(
        &self,
        inputs: SearchSpendingItemInput,
    ) -> Result<Option<SpendingItem>> {
        search_spending_item_handler(inputs).await
    }
}
