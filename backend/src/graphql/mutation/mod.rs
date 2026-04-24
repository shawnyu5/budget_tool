use anyhow::Result;
use async_graphql::{Context, Object, Result as GraphqlResult};
use tracing::instrument;

use crate::graphql::{
    mutation::{
        add_transaction_v2::{AddTransactionResponseV2, AddTransactionV2Input, add_transaction_v2},
        delete_transaction_by_id_v2::{
            DeleteTransactionByIdV2Input, DeleteTransactionByIdV2Response,
            delete_transaction_by_id_v2,
        },
        save_subscription_v2::{
            SaveSubscriptionV2Response, SaveSubscriptionV2input, save_subscription_v2,
        },
        update_month_settings_v2::{
            UpdateMonthSettingsInput, UpdateMonthSettingsResponse, update_month_settings_v2,
        },
        update_transaction_by_id_v2::{
            UpdateTransactionByIdV2Input, UpdateTransactionByIdV2Response,
            update_transaction_by_id_v2,
        },
    },
    utils::AuthGuard,
};

mod add_transaction_v2;
mod delete_transaction_by_id_v2;
mod save_subscription_v2;
mod update_month_settings_v2;
mod update_transaction_by_id_v2;

/// Root of the Mutation
#[derive(Default, Clone, Debug)]
pub struct MutationRoot;

#[Object]
impl MutationRoot {
    /// Save the user subscription to Postgres DB
    #[graphql(guard = "AuthGuard")]
    async fn save_subscription_v2(
        &self,
        ctx: &Context<'_>,
        input: SaveSubscriptionV2input,
    ) -> GraphqlResult<SaveSubscriptionV2Response> {
        save_subscription_v2(ctx, input).await
    }

    /// Update the settings for a specific month, in the Postgres DB
    #[instrument(skip(self, ctx))]
    #[graphql(guard = "AuthGuard")]
    async fn update_month_settings_v2(
        &self,
        ctx: &Context<'_>,
        inputs: UpdateMonthSettingsInput,
    ) -> Result<UpdateMonthSettingsResponse> {
        return update_month_settings_v2(ctx, inputs).await;
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
}
