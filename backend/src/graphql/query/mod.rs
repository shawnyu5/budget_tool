use crate::{
    graphql::query::firefly_v2::{FireflyV2SuccessResponse, firefly_v2},
    models::User as UserModel,
};
use anyhow::Result;
use async_graphql::{Context, Object};
use tracing::instrument;

use crate::{
    db::postgres::models::Year,
    graphql::{
        query::{
            config::{FrontendConfig, config_handler},
            home_page::{HomePageV2Input, home_page_v2},
            me_v2::me_v2_handler,
            monthly_settings_v2::{MonthlySettingsResponse, month_settings_v2},
            search_transaction_v2::{
                SearchTransactionV2Inputs, SearchTransactionV2Response, search_transaction_v2,
            },
        },
        utils::AuthGuard,
    },
    models::HomePage,
    month::Month,
};

mod config;
mod firefly_v2;
mod home_page;
mod me_v2;
mod monthly_settings_v2;
mod search_transaction_v2;

/// Root of the graphql query
#[derive(Default, Clone, Debug)]
pub struct QueryRoot;

#[Object]
/// Root of the query
impl QueryRoot {
    /// Configuration for the frontend to consume
    #[instrument(skip(self), name = "query_config")]
    async fn config(&self) -> FrontendConfig {
        config_handler().await
    }

    /// Get the settings for a particular month. Retrieves the data from PostgresDB
    /// If there are no settings for the month, check the previous month. If it exists, insert the previous month settings into the month being queried
    #[instrument(skip(self, ctx), name = "query_month_settings_v2")]
    #[graphql(guard = "AuthGuard")]
    async fn month_settings_v2(
        &self,
        ctx: &Context<'_>,
        year: Year,
        month: Month,
    ) -> Result<MonthlySettingsResponse> {
        month_settings_v2(ctx, year, month).await
    }

    /// Returns the content of the JWT
    #[graphql(guard = "AuthGuard")]
    async fn me_v2(&self, ctx: &Context<'_>) -> Result<UserModel> {
        me_v2_handler(ctx).await
    }

    /// Query information from the Firefly server
    #[instrument(skip(self, ctx), name = "query_firefly_v2")]
    #[graphql(guard = "AuthGuard")]
    async fn firefly_v2(&self, ctx: &Context<'_>) -> Result<Option<FireflyV2SuccessResponse>> {
        firefly_v2(ctx).await
    }

    /// Get data to display on the home page
    #[instrument(skip(self, ctx), name = "query_home_page_v2")]
    #[graphql(guard = "AuthGuard")]
    pub async fn home_page_v2(
        &self,
        ctx: &Context<'_>,
        inputs: HomePageV2Input,
    ) -> Result<HomePage> {
        home_page_v2(ctx, inputs).await
    }

    /// Search for a transaction from the PostgresDB
    #[instrument(skip(self, ctx), name = "query_search_transaction_v2")]
    #[graphql(guard = "AuthGuard")]
    async fn search_transaction_v2(
        &self,
        ctx: &Context<'_>,
        inputs: SearchTransactionV2Inputs,
    ) -> Result<SearchTransactionV2Response> {
        search_transaction_v2(ctx, inputs).await
    }

    // /// Send notifications to certain users
    // #[instrument(skip(self, ctx))]
    // #[graphql(guard = "AuthGuard")]
    // async fn send_notification(
    //     &self,
    //     ctx: &Context<'_>,
    //     inputs: SendNotificationInput,
    // ) -> Result<SendNotificationResponse> {
    //     send_notification(ctx, inputs).await
    // }
    //
    // /// Get a list of the core users of the system
    // #[graphql(guard = "AuthGuard")]
    // async fn get_core_users(&self, ctx: &Context<'_>) -> Result<CoreUsersResponse> {
    //     core_users(ctx).await
    // }
}
