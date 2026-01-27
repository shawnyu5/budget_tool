use anyhow::Result;
use async_graphql::{Context, Object};
use tracing::instrument;

use crate::{
    db::users::User,
    graphql::{
        mutation::{
            MonthlyBudgetResponse, add_spending_item_by_month::AddSpendingItemByMonthResponse,
            update_monthly_budget_config::MonthlyBudgetConfigResponse,
        },
        query::{
            config::{FrontendConfig, config_handler},
            me::me_handler,
            monthly_budget::monthly_budget_handler,
            monthly_budget_config::monthly_budget_config_handler,
        },
        utils::AuthGuard,
    },
    month::Month,
};

mod config;
mod me;
mod monthly_budget;
mod monthly_budget_config;

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
}
