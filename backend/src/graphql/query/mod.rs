use anyhow::Result;
use async_graphql::{Context, Object};
use tracing::instrument;

use crate::{
    db::{postgres::models::Year, users::User},
    graphql::{
        mutation::{
            MonthlyBudgetResponse, update_monthly_budget_config::MonthlyBudgetConfigResponse,
        },
        query::{
            config::{FrontendConfig, config_handler},
            firefly::{FireflySuccessResponse, firefly_handler},
            home_page::{HomePageV2Input, home_page_v2},
            me::me_handler,
            monthly_budget::monthly_budget_handler,
            monthly_budget_config::monthly_budget_config_handler,
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
mod home_page;
mod me;
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

    /// Get the settings for a particular month. Retrieves the data from PostgresDB
    /// If there are no settings for the month, check the previous month. If it exists, insert the previous month settings into the month being queried
    #[instrument(skip_all)]
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
    #[graphql(guard = "AuthGuard")]
    async fn me(&self, ctx: &Context<'_>) -> Result<User> {
        me_handler(ctx).await
    }

    #[instrument(skip_all)]
    #[graphql(guard = "AuthGuard")]
    /// Retrieve information from Firefly it self
    async fn firefly(&self, ctx: &Context<'_>) -> Result<FireflySuccessResponse> {
        firefly_handler(ctx).await
    }

    #[instrument(skip_all)]
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
    #[instrument(skip_all)]
    #[graphql(guard = "AuthGuard")]
    pub async fn home_page_v2(
        &self,
        ctx: &Context<'_>,
        inputs: HomePageV2Input,
    ) -> Result<HomePage> {
        home_page_v2(ctx, inputs).await
    }

    /// Search for a transaction from the PostgresDB
    #[instrument(skip_all)]
    #[graphql(guard = "AuthGuard")]
    async fn search_transaction_v2(
        &self,
        ctx: &Context<'_>,
        inputs: SearchTransactionV2Inputs,
    ) -> Result<SearchTransactionV2Response> {
        search_transaction_v2(ctx, inputs).await
    }
}

#[cfg(test)]
mod tests {
    use anyhow::Context;
    use async_graphql::{EmptyMutation, EmptySubscription, Request, Schema, Variables, value};
    use chrono::Utc;
    use rust_decimal::Decimal;
    use sqlx::{PgPool, query};
    use tracing::info;

    use crate::{db::postgres::PostgresDB, test_utils::mock_jwt};

    use super::*;

    #[sqlx::test]
    #[tracing_test::traced_test]
    /// Test querying a month's settings where the exists budget for that month
    /// The endpoint should return the existing settings for the current month
    async fn test_month_setting_query_with_existing_month_setting(pool: PgPool) -> Result<()> {
        let db = PostgresDB { pool };
        let mut tx = db
            .transaction()
            .await
            .expect("Failed to start DB transaction");

        // info!("Inserting 2026, January into months table");
        // db.insert_new_month(2026, Month::January)
        //     .await
        //     .context("Failed to insert new Month")?;

        let core_users = db
            .get_core_users(&mut *tx)
            .await
            .context("Failed to get core users")?;

        for user in core_users {
            info!("Inserting budget_allocation for user {}", user.username);
            info!("contribution_amount: {}", Decimal::new(100, 0));

            db.insert_new_budget_allocation(
                &mut tx,
                2026,
                Month::January,
                user.id,
                Decimal::new(50, 0),
                Decimal::new(100, 0),
            )
            .await
            .context("Failed to insert new budget_allocation")?;
        }
        tx.commit().await?;

        let query = r#"
query($year: Int!, $month: Month!) {
  monthSettingsV2(year: $year, month: $month) {
    settings {
      totalAllocation
      shawnPercentageAllocation
      shawnContributionAmount
      maggiePercentageAllocation
      maggieContributionAmount
    }
  }
}
            "#;

        let mock_jwt = mock_jwt();
        let schema = Schema::build(QueryRoot, EmptyMutation, EmptySubscription).finish();
        let request = Request::new(query)
            .variables(Variables::from_value(value!({
                "year": 2026,
                "month": Month::January
            })))
            .data(mock_jwt)
            .data(db.clone());

        let res = schema.execute(request).await;
        assert!(res.errors.is_empty());
        let data = res.data.into_json().unwrap();
        let settings = &data["monthSettingsV2"]["settings"];
        assert_eq!(settings["shawnPercentageAllocation"], "50.00");
        assert_eq!(settings["maggiePercentageAllocation"], "50.00");
        assert_eq!(settings["totalAllocation"], "200.00");
        assert_eq!(settings["shawnContributionAmount"], "100.00");
        assert_eq!(settings["maggieContributionAmount"], "100.00");

        return Ok(());
    }

    #[sqlx::test]
    #[tracing_test::traced_test]
    /// Test querying a month's settings where there are no existing budget for that month
    /// The endpoint should return the settings from the previous month instead
    async fn test_month_setting_query_with_not_existing_month_setting(pool: PgPool) -> Result<()> {
        let db = PostgresDB { pool };
        let mut tx = db
            .transaction()
            .await
            .expect("Failed to start DB transaction");

        // info!("Inserting 2026, January into months table");
        // db.insert_new_month(2026, Month::January)
        //     .await
        //     .context("Failed to insert new Month")?;

        let core_users = db
            .get_core_users(&mut *tx)
            .await
            .context("Failed to get core users")?;

        for user in core_users {
            info!("Inserting budget_allocation for user {}", user.username);
            info!("contribution_amount: {}", Decimal::new(100, 0));

            db.insert_new_budget_allocation(
                &mut tx,
                2026,
                Month::January,
                user.id,
                Decimal::new(50, 0),
                Decimal::new(100, 0),
            )
            .await
            .context("Failed to insert new budget_allocation")?;
        }
        tx.commit().await?;

        let query = r#"
query($year: Int!, $month: Month!) {
  monthSettingsV2(year: $year, month: $month) {
    settings {
      totalAllocation
      shawnPercentageAllocation
      shawnContributionAmount
      maggiePercentageAllocation
      maggieContributionAmount
    }
  }
}
            "#;

        let mock_jwt = mock_jwt();
        let schema = Schema::build(QueryRoot, EmptyMutation, EmptySubscription).finish();
        let request = Request::new(query)
            .variables(Variables::from_value(value!({
                "year": 2026,
                "month": Month::February
            })))
            .data(mock_jwt)
            .data(db.clone());

        let res = schema.execute(request).await;
        assert!(res.errors.is_empty(), "{:#?}", res.errors);
        let data = res.data.into_json().unwrap();
        let settings = &data["monthSettingsV2"]["settings"];
        assert_eq!(settings["shawnPercentageAllocation"], "50.00");
        assert_eq!(settings["maggiePercentageAllocation"], "50.00");
        assert_eq!(settings["totalAllocation"], "200.00");
        assert_eq!(settings["shawnContributionAmount"], "100.00");
        assert_eq!(settings["maggieContributionAmount"], "100.00");

        Ok(())
    }
}
