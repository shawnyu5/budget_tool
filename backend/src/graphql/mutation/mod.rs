use anyhow::Result;
use async_graphql::{Context, Object, Result as GraphqlResult, Union};
use tracing::instrument;

use crate::{
    db::users::User,
    graphql::{
        error::GraphQLErrorObject,
        mutation::{
            add_spending_item_by_month::{
                AddSpendingItemByMonthInput, AddSpendingItemByMonthResponse,
                add_spending_item_by_month_handler,
            },
            add_transaction_v2::{
                AddTransactionResponseV2, AddTransactionV2Input, add_transaction_v2,
            },
            delete_spending_item_by_id::{
                DeleteSpendingItemByIdInput, delete_spending_item_by_id_handler,
            },
            delete_transaction_by_id_v2::{
                DeleteTransactionByIdV2Input, DeleteTransactionByIdV2Response,
                delete_transaction_by_id_v2,
            },
            save_subscription::{SubscriptionInput, save_subscription_handler},
            save_subscription_v2::{
                SaveSubscriptionV2Response, SaveSubscriptionV2input, save_subscription_v2,
            },
            update_me::{UpdateMe, UpdateMeResponse, update_me_handler},
            update_month_settings::{
                UpdateMonthSettingsInput, UpdateMonthSettingsResponse, update_month_settings,
            },
            update_monthly_budget::{UpdateMonthlyBudgetInput, update_monthly_budget_handler},
            update_monthly_budget_config::{
                UpdateBudgetConfigInput, UpdateBudgetConfigResponse, update_budget_config_handler,
            },
            update_spending_item_by_id::{
                UpdateSpendingItemByIdInput, UpdateSpendingItemByIdResponse,
                update_spending_item_by_id_handler,
            },
            update_transaction_by_id_v2::{
                UpdateTransactionByIdV2Input, UpdateTransactionByIdV2Response,
                update_transaction_by_id_v2,
            },
        },
        utils::AuthGuard,
    },
    monthly_budget::MonthlyBudget,
};

pub mod add_spending_item_by_month;
mod add_transaction_v2;
pub mod delete_spending_item_by_id;
mod delete_transaction_by_id_v2;
pub mod save_subscription;
mod save_subscription_v2;
pub mod update_me;
pub mod update_month_settings;
pub mod update_monthly_budget;
pub mod update_monthly_budget_config;
pub mod update_spending_item_by_id;
mod update_transaction_by_id_v2;

#[derive(Union)]
pub enum MonthlyBudgetResponse {
    MonthlyBudget(MonthlyBudget),
    Error(GraphQLErrorObject),
}

/// Root of the Mutation
#[derive(Default, Clone, Debug)]
pub struct MutationRoot;

#[Object]
impl MutationRoot {
    /// Save a notification subscription for a user
    /// The user is extracted from the JWT
    #[deprecated = "Save to the PostgresDB instead"]
    #[graphql(deprecation = "Save to the PostgresDB instead")]
    #[instrument(skip(self, ctx))]
    async fn save_subscription(
        &self,
        ctx: &Context<'_>,
        subscription: SubscriptionInput,
    ) -> Result<User> {
        return save_subscription_handler(ctx, subscription).await;
    }

    /// Save the user subscription to Postgres DB
    #[graphql(guard = "AuthGuard")]
    async fn save_subscription_v2(
        &self,
        ctx: &Context<'_>,
        input: SaveSubscriptionV2input,
    ) -> GraphqlResult<SaveSubscriptionV2Response> {
        save_subscription_v2(ctx, input).await
    }

    /// Update the budget configuration for a specific month
    #[instrument(skip_all)]
    #[deprecated = "prefer `update_month_settings_v2`"]
    #[graphql(
        guard = "AuthGuard",
        deprecation = "use `update_month_settings_v2` to save to the PostgresDB"
    )]
    async fn update_monthly_budget_config(
        &self,
        ctx: &Context<'_>,
        inputs: UpdateBudgetConfigInput,
    ) -> Result<UpdateBudgetConfigResponse> {
        return update_budget_config_handler(ctx, inputs).await;
    }

    /// Update the settings for a specific month, in the Postgres DB
    #[instrument(skip(self, ctx))]
    #[graphql(guard = "AuthGuard")]
    async fn update_month_settings_v2(
        &self,
        ctx: &Context<'_>,
        inputs: UpdateMonthSettingsInput,
    ) -> Result<UpdateMonthSettingsResponse> {
        return update_month_settings(ctx, inputs).await;
    }

    #[instrument(skip_all)]
    #[graphql(
        guard = "AuthGuard",
        deprecation = "use `add_transaction_v2` to save to the PostgresDB"
    )]
    /// Add a spending item to a month
    async fn add_spending_item_by_month(
        &self,
        ctx: &Context<'_>,
        inputs: AddSpendingItemByMonthInput,
    ) -> Result<AddSpendingItemByMonthResponse> {
        add_spending_item_by_month_handler(ctx, inputs).await
    }

    #[instrument(skip_all)]
    #[graphql(
        guard = "AuthGuard",
        deprecation = "use `delete_transaction_by_id_v2` to delete from the PostgresDB"
    )]
    /// Delete a spending item by ID. If the item doesnt exist, this handler will not do anything
    async fn delete_spending_item_by_id(
        &self,
        ctx: &Context<'_>,
        inputs: DeleteSpendingItemByIdInput,
    ) -> Result<MonthlyBudgetResponse> {
        return delete_spending_item_by_id_handler(ctx, inputs).await;
    }

    #[instrument(skip(self))]
    #[graphql(guard = "AuthGuard")]
    /// Delete a transaction by ID from the PostgresDB
    async fn delete_transaction_by_id_v2(
        &self,
        inputs: DeleteTransactionByIdV2Input,
    ) -> Result<DeleteTransactionByIdV2Response> {
        delete_transaction_by_id_v2(inputs).await
    }

    #[instrument(skip(self, ctx))]
    /// Update a spending item by ID
    #[graphql(guard = "AuthGuard")]
    async fn update_spending_item_by_id(
        &self,
        ctx: &Context<'_>,
        inputs: UpdateSpendingItemByIdInput,
    ) -> Result<UpdateSpendingItemByIdResponse> {
        return update_spending_item_by_id_handler(ctx, inputs).await;
    }

    /// Add a transaction
    #[instrument(skip(self, ctx))]
    #[graphql(guard = "AuthGuard")]
    async fn add_transaction_v2(
        &self,
        ctx: &Context<'_>,
        inputs: AddTransactionV2Input,
    ) -> Result<AddTransactionResponseV2> {
        add_transaction_v2(ctx, inputs).await
    }

    /// Update a transaction by ID
    #[instrument(skip(self))]
    #[graphql(guard = "AuthGuard")]
    pub async fn update_transaction_by_id_v2(
        &self,
        inputs: UpdateTransactionByIdV2Input,
    ) -> Result<UpdateTransactionByIdV2Response> {
        update_transaction_by_id_v2(inputs).await
    }

    #[instrument(skip(self, ctx))]
    #[graphql(
        guard = "AuthGuard",
        deprecation = "Do not use this handler anymore. Prefer the more finegrained updates instead"
    )]
    /// Update the budget for a specific month
    async fn update_monthly_budget(
        &self,
        ctx: &Context<'_>,
        inputs: UpdateMonthlyBudgetInput,
    ) -> Result<MonthlyBudgetResponse> {
        update_monthly_budget_handler(ctx, inputs).await
    }

    #[instrument(skip(self, ctx))]
    #[graphql(guard = "AuthGuard")]
    async fn me(&self, ctx: &Context<'_>, inputs: UpdateMe) -> Result<UpdateMeResponse> {
        update_me_handler(ctx, inputs).await
    }
}
