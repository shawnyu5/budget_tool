use crate::{
    graphql::query::firefly_v2::{FireflyV2SuccessResponse, firefly_v2},
    models::User as UserModel,
};
use anyhow::Result;
use async_graphql::{Context, Object};
use tracing::instrument;

use crate::{
    db::{postgres::models::Year, users::User},
    graphql::{
        query::{
            config::{FrontendConfig, config_handler},
            firefly::{FireflySuccessResponse, firefly_handler},
            home_page::{HomePageV2Input, home_page_v2},
            me::me_handler,
            me_v2::me_v2_handler,
            monthly_settings_v2::{MonthlySettingsResponse, month_settings_v2},
            search_transaction_v2::{
                SearchTransactionV2Inputs, SearchTransactionV2Response, search_transaction_v2,
            },
            spending_item::{SearchSpendingItemInput, search_spending_item_handler},
        },
        utils::AuthGuard,
    },
    models::HomePage,
    month::Month,
    monthly_budget::SpendingItem,
};

mod config;
pub mod firefly;
mod firefly_v2;
mod home_page;
mod me;
mod me_v2;
mod monthly_budget;
mod monthly_budget_config;
mod monthly_settings_v2;
mod search_transaction_v2;
pub mod spending_item;

/// Root of the graphql query
#[derive(Default, Clone, Debug)]
pub struct QueryRoot;

#[Object]
/// Root of the query
impl QueryRoot {
    /// Configuration for the frontend to consume
    #[instrument(skip_all, name = "query_config")]
    async fn config(&self) -> FrontendConfig {
        config_handler().await
    }

    /// Get the settings for a particular month. Retrieves the data from PostgresDB
    /// If there are no settings for the month, check the previous month. If it exists, insert the previous month settings into the month being queried
    #[instrument(skip_all, name = "query_month_settings_v2")]
    #[graphql(guard = "AuthGuard")]
    async fn month_settings_v2(
        &self,
        ctx: &Context<'_>,
        year: Year,
        month: Month,
    ) -> Result<MonthlySettingsResponse> {
        month_settings_v2(ctx, year, month).await
    }

    #[instrument(skip_all)]
    #[deprecated = "replaced by me_v2"]
    #[graphql(
        guard = "AuthGuard",
        deprecation = "use `me_v2` to get user data from the PostgresDB instead"
    )]
    async fn me(&self, ctx: &Context<'_>) -> Result<User> {
        me_handler(ctx).await
    }

    /// Returns the content of the JWT
    #[graphql(guard = "AuthGuard")]
    async fn me_v2(&self, ctx: &Context<'_>) -> Result<UserModel> {
        me_v2_handler(ctx).await
    }

    #[instrument(skip_all)]
    #[deprecated = "Use firefly_v2 to query data from the Postgres DB"]
    #[graphql(guard = "AuthGuard")]
    /// Retrieve information from Firefly it self
    async fn firefly(&self, ctx: &Context<'_>) -> Result<FireflySuccessResponse> {
        firefly_handler(ctx).await
    }

    #[instrument(skip_all, name = "query_firefly_v2")]
    #[graphql(guard = "AuthGuard")]
    async fn firefly_v2(&self, ctx: &Context<'_>) -> Result<Option<FireflyV2SuccessResponse>> {
        firefly_v2(ctx).await
    }

    #[instrument(skip_all)]
    #[deprecated = "Use search_transaction_v2"]
    #[graphql(
        guard = "AuthGuard",
        deprecation = "Use `search_transaction_v2` to search the PostgresDB instead"
    )]
    /// Search for a spending item by time and ID
    pub async fn search_spending_item(
        &self,
        inputs: SearchSpendingItemInput,
    ) -> Result<Option<SpendingItem>> {
        search_spending_item_handler(inputs).await
    }

    /// Get data to display on the home page
    #[instrument(skip_all, name = "query_home_page_v2")]
    #[graphql(guard = "AuthGuard")]
    pub async fn home_page_v2(
        &self,
        ctx: &Context<'_>,
        inputs: HomePageV2Input,
    ) -> Result<HomePage> {
        home_page_v2(ctx, inputs).await
    }

    /// Search for a transaction from the PostgresDB
    #[instrument(skip_all, name = "query_search_transaction_v2")]
    #[graphql(guard = "AuthGuard")]
    async fn search_transaction_v2(
        &self,
        ctx: &Context<'_>,
        inputs: SearchTransactionV2Inputs,
    ) -> Result<SearchTransactionV2Response> {
        search_transaction_v2(ctx, inputs).await
    }
}
