use anyhow::Result;
use async_graphql::{Context, Object, Union};
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
            delete_spending_item_by_id::{
                DeleteSpendingItemByIdInput, delete_spending_item_by_id_handler,
            },
            save_subscription::{SubscriptionInput, save_subscription_handler},
            update_me::{UpdateMe, UpdateMeResponse, update_me_handler},
            update_monthly_budget::{UpdateMonthlyBudgetInput, update_monthly_budget_handler},
            update_monthly_budget_config::{
                UpdateBudgetConfigInput, UpdateBudgetConfigResponse, update_budget_config_handler,
            },
            update_spending_item_by_id::{
                UpdateSpendingItemByIdInput, UpdateSpendingItemByIdResponse,
                update_spending_item_by_id_handler,
            },
        },
        utils::AuthGuard,
    },
    monthly_budget::MonthlyBudget,
};

pub mod add_spending_item_by_month;
pub mod delete_spending_item_by_id;
pub mod save_subscription;
pub mod update_me;
pub mod update_monthly_budget;
pub mod update_monthly_budget_config;
pub mod update_spending_item_by_id;

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
    #[instrument(skip_all)]
    async fn save_subscription(
        &self,
        ctx: &Context<'_>,
        subscription: SubscriptionInput,
    ) -> Result<User> {
        return save_subscription_handler(ctx, subscription).await;
    }

    /// Update the budget configuration for a specific month
    #[instrument(skip_all)]
    #[graphql(guard = "AuthGuard")]
    async fn update_monthly_budget_config(
        &self,
        ctx: &Context<'_>,
        inputs: UpdateBudgetConfigInput,
    ) -> Result<UpdateBudgetConfigResponse> {
        return update_budget_config_handler(ctx, inputs).await;
    }

    #[instrument(skip_all)]
    #[graphql(guard = "AuthGuard")]
    /// Add a spending item to a month
    async fn add_spending_item_by_month(
        &self,
        ctx: &Context<'_>,
        inputs: AddSpendingItemByMonthInput,
    ) -> Result<AddSpendingItemByMonthResponse> {
        add_spending_item_by_month_handler(ctx, inputs).await
    }

    #[instrument(skip_all)]
    #[graphql(guard = "AuthGuard")]
    /// Delete a spending item by ID. If the item doesnt exist, this handler will not do anything
    async fn delete_spending_item_by_id(
        &self,
        ctx: &Context<'_>,
        inputs: DeleteSpendingItemByIdInput,
    ) -> Result<MonthlyBudgetResponse> {
        return delete_spending_item_by_id_handler(ctx, inputs).await;
    }

    #[instrument(skip_all)]
    /// Update a spending item by ID
    #[graphql(guard = "AuthGuard")]
    async fn update_spending_item_by_id(
        &self,
        ctx: &Context<'_>,
        inputs: UpdateSpendingItemByIdInput,
    ) -> Result<UpdateSpendingItemByIdResponse> {
        return update_spending_item_by_id_handler(ctx, inputs).await;
    }

    #[instrument(skip_all)]
    #[graphql(guard = "AuthGuard")]
    /// Update the budget for a specific month
    async fn update_monthly_budget(
        &self,
        ctx: &Context<'_>,
        inputs: UpdateMonthlyBudgetInput,
    ) -> Result<MonthlyBudgetResponse> {
        update_monthly_budget_handler(ctx, inputs).await
    }

    async fn me(&self, ctx: &Context<'_>, inputs: UpdateMe) -> Result<UpdateMeResponse> {
        update_me_handler(ctx, inputs).await
    }
}
