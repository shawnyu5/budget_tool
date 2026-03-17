use anyhow::{Context as _, Result};
use async_graphql::{Context, SimpleObject};

use crate::{
    db::postgres::models::Year,
    graphql::utils::{extract_db_client, extract_jwt},
    models::{FireflySettings, Settings},
    month::Month,
};

#[derive(SimpleObject)]
pub struct MonthlySettingsResponse {
    pub settings: Settings,
}

pub async fn month_settings_v2(
    ctx: &Context<'_>,
    year: Year,
    month: Month,
) -> Result<MonthlySettingsResponse> {
    let jwt = extract_jwt(ctx)?;
    let db = extract_db_client(ctx);
    let mut tx = db.transaction().await?;
    let current_user = db.get_user(&jwt.username).await?;
    let shawn_user = db.get_user("shawn").await?;
    let maggie_user = db.get_user("maggie").await?;

    let month_row = db
        .get_or_insert_month(&mut tx, year, month)
        .await
        .context("Failed to get or insert month")?;

    let shawn_allocation = db
        .get_or_insert_budget_allocation(&mut tx, year, month_row.month, shawn_user.id)
        .await?;
    let maggie_allocation = db
        .get_or_insert_budget_allocation(&mut tx, year, month_row.month, maggie_user.id)
        .await?;
    let firefly = db.get_user_firefly_settings(current_user.id).await?;
    let total_allocation = db.compute_total_allocation(&mut *tx, year, month).await?;

    tx.commit().await.context("Failed to commit transaction")?;
    Ok(MonthlySettingsResponse {
        settings: Settings {
            total_allocation,
            shawn_percentage_allocation: shawn_allocation.percentage_allocation,
            shawn_contribution_amount: shawn_allocation.contribution_amount,
            maggie_percentage_allocation: maggie_allocation.percentage_allocation,
            maggie_contribution_amount: maggie_allocation.contribution_amount,
            firefly: FireflySettings {
                enabled: firefly.enabled,
                api_key: firefly.api_key,
                source_account: firefly.source_account,
            },
        },
    })
}

#[cfg(test)]
mod tests {
    use crate::graphql::QueryRoot;
    use anyhow::Context;
    use async_graphql::{EmptyMutation, EmptySubscription, Request, Schema, Variables, value};
    use rust_decimal::Decimal;
    use sqlx::PgPool;
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
