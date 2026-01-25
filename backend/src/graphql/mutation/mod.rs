use anyhow::Result;
use async_graphql::{Context, Object};
use tracing::instrument;

use crate::{
    db::users::User,
    graphql::mutation::{
        add_spending_item_by_month::{
            add_spending_item_by_month_handler, AddSpendingItemByMonthInput, MonthlyBudgetResponse,
        },
        delete_spending_item_by_id::{
            delete_spending_item_by_id_handler, DeleteSpendingItemByIdInput,
        },
        save_subscription::{save_subscription_handler, SubscriptionInput},
        update_me::{update_me_handler, UpdateMe, UpdateMeResponse},
        update_monthly_budget::{update_monthly_budget_handler, UpdateMonthlyBudgetInput},
        update_monthly_budget_config::{
            update_budget_config_handler, UpdateBudgetConfigInput, UpdateBudgetConfigResponse,
        },
        update_spending_item_by_id::{
            update_spending_item_by_id_handler, UpdateSpendingItemByIdInput,
        },
    },
};

pub mod add_spending_item_by_month;
pub mod delete_spending_item_by_id;
pub mod save_subscription;
pub mod update_me;
pub mod update_monthly_budget;
pub mod update_monthly_budget_config;
pub mod update_spending_item_by_id;

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
    async fn update_monthly_budget_config(
        &self,
        ctx: &Context<'_>,
        inputs: UpdateBudgetConfigInput,
    ) -> Result<UpdateBudgetConfigResponse> {
        return update_budget_config_handler(ctx, inputs).await;
    }

    #[instrument(skip_all)]
    /// Add a spending item to a month
    async fn add_spending_item_by_month(
        &self,
        ctx: &Context<'_>,
        inputs: AddSpendingItemByMonthInput,
    ) -> Result<MonthlyBudgetResponse> {
        return add_spending_item_by_month_handler(ctx, inputs).await;
    }

    #[instrument(skip_all)]
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
    async fn update_spending_item_by_id(
        &self,
        ctx: &Context<'_>,
        inputs: UpdateSpendingItemByIdInput,
    ) -> Result<MonthlyBudgetResponse> {
        return update_spending_item_by_id_handler(ctx, inputs).await;
    }

    #[instrument(skip_all)]
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
