use crate::db::postgres::PostgresDB;
use crate::db::postgres::models::Year;
use crate::db::postgres::models::transaction::SplitMode;
use crate::graphql::utils::extract_db_client;
use crate::models::Transaction;
use crate::month::Month;
use anyhow::Context as AnhowContext;
use anyhow::Result;
use async_graphql::Context;
use async_graphql::InputObject;
use async_graphql::SimpleObject;
use tracing::info;
use tracing::{error, instrument};

#[derive(InputObject)]
pub struct AddTransactionV2Input {
    pub year: Year,
    pub month: Month,
    pub transaction: Transaction,
}

#[derive(SimpleObject)]
pub struct AddTransactionResponseV2 {
    success: bool,
}

#[instrument(skip_all)]
pub async fn add_transaction_v2(
    ctx: &Context<'_>,
    inputs: AddTransactionV2Input,
) -> Result<AddTransactionResponseV2> {
    let db = extract_db_client(ctx);
    let mut tx = db
        .transaction()
        .await
        .context("Failed to start transaction")?;

    db.get_or_insert_month(&mut tx, inputs.year, inputs.month)
        .await?;

    let total_spend = db
        .compute_total_spend(&mut tx, inputs.year, inputs.month)
        .await?;

    let total_allocation = db
        .compute_total_allocation(&mut tx, inputs.year, inputs.month)
        .await?;

    // If we are not over budget yet, and adding this new transaction will put us over budget, split it into 2 transactions
    if total_spend < total_allocation
        && (total_spend + inputs.transaction.amount) > total_allocation
    {
        info!("New transaction will go over budget. Splitting into 2 transactions...");
        // $ amount for the first split
        let regular_transaction_amount = total_allocation - inputs.transaction.amount;
        let overflow_transaction_amount = inputs.transaction.amount - regular_transaction_amount;
        info!("Inserting split 1 transaction");
        db.insert_new_transaction(
            &mut tx,
            inputs.year,
            inputs.month,
            regular_transaction_amount,
            inputs.transaction.date,
            &inputs.transaction.description,
            &inputs.transaction.notes,
            Some(SplitMode::FromSettings),
        )
        .await
        .map_err(|e| {
            error!("{e:#?}");
            e
        })
        .context("Failed to split 1 transaction")?;
        assert_eq!(
            db.compute_total_allocation(&mut tx, inputs.year, inputs.month)
                .await?,
            db.compute_total_spend(&mut tx, inputs.year, inputs.month)
                .await?,
            "At this point, total spend should == total allocation. Calculation is wrong if this is not the case"
        );

        info!("Inserting overflow transaction. With amount {overflow_transaction_amount}");
        db.insert_new_transaction(
            &mut tx,
            inputs.year,
            inputs.month,
            overflow_transaction_amount,
            inputs.transaction.date,
            &format!("{} - OVERFLOW", inputs.transaction.description),
            &inputs.transaction.notes,
            Some(SplitMode::Evenly),
        )
        .await
        .map_err(|e| {
            error!("{e:#?}");
            e
        })
        .context("Failed to insert overflow transaction")?;
    } else if total_spend > total_allocation {
        // We are already over budget
        info!("Already over budget. Inserting transaction with SplitMode::Evenly");
        db.insert_new_transaction(
            &mut tx,
            inputs.year,
            inputs.month,
            inputs.transaction.amount,
            inputs.transaction.date,
            &inputs.transaction.description,
            &inputs.transaction.notes,
            Some(SplitMode::Evenly),
        )
        .await
        .map_err(|e| {
            error!("{e:#?}");
            e
        })
        .context("Failed to insert transaction into DB")?;
    } else {
        info!("New transaction will stay within budget. Adding transaction normally");
        db.insert_new_transaction(
            &mut tx,
            inputs.year,
            inputs.month,
            inputs.transaction.amount,
            inputs.transaction.date,
            &inputs.transaction.description,
            &inputs.transaction.notes,
            Some(SplitMode::FromSettings),
        )
        .await
        .map_err(|e| {
            error!("{e:#?}");
            e
        })
        .context("Failed to insert transaction into DB")?;
    }

    tx.commit().await.context("Failed to convert transaction")?;

    // TODO: add transaction in firefly
    Ok(AddTransactionResponseV2 { success: true })

    // let mut month_budget = budget_db
    //     .get_month_budget(inputs.month)
    //     .await
    //     .context("Failed to get monthly budget")?;

    // month_budget.spending.push(inputs.spending_item.clone());
    // month_budget.update_calculations();
    // month_budget.sort_by_date();
    //
    // info!("Updated budget: {:#?}", month_budget);
    // budget_db
    //     .update_monthly_budget(inputs.month, &month_budget)
    //     .await
    //     .context("Failed to save updated budget to DB")?;
    //
    // let user_db = MongoDB::new(USER_TABLE_NAME).await?;
    // let http_client = extract_http_client(ctx);
    // let dt_est = Utc::now().with_timezone(&New_York);
    // let rn = dt_est.to_rfc3339();
    //
    // let users = user_db
    //     .get_all_users()
    //     .await
    //     .context("Failed to get all users from DB")?;
    //
    // let config = Config::load();
    // let monthly_budget_config = month_budget.budget;
    //
    // for mut user in users {
    //     let mut amount = 0.0;
    //     if user.username == "shawn" {
    //         amount = calculate_percentage(
    //             inputs.spending_item.amount,
    //             monthly_budget_config.shawn_percentage_allocation,
    //         );
    //     } else if user.username == "maggie" {
    //         amount = calculate_percentage(
    //             inputs.spending_item.amount,
    //             monthly_budget_config.maggie_percentage_allocation,
    //         );
    //     } else {
    //         warn!(
    //             "Unsupported firefly user: {}. Not creating firefly transaction",
    //             user.username
    //         );
    //         continue;
    //     };
    //
    //     if user.firefly.is_none()
    //         || user
    //             .firefly
    //             .as_ref()
    //             .is_some_and(|firefly| !firefly.enabled)
    //     {
    //         continue;
    //     }
    //     user.decrypt_firefly_api_key()?;
    //     info!("Creating firefly transaction for user {}", &user.username);
    //     match firefly_client::apis::transactions_api::store_transaction(
    //         &firefly_client::apis::configuration::Configuration {
    //             base_path: config.firefly_url.clone(),
    //             client: http_client.clone(),
    //             bearer_access_token: user.firefly.clone().unwrap().api_key.clone(),
    //             ..Default::default()
    //         },
    //         TransactionStore {
    //             error_if_duplicate_hash: Some(false),
    //             apply_rules: Some(true),
    //             fire_webhooks: Some(true),
    //             group_title: None,
    //             transactions: vec![TransactionSplitStore {
    //                 r#type: TransactionTypeProperty::Withdrawal,
    //                 date: rn.clone(),
    //                 amount: amount.to_string(),
    //                 description: inputs.spending_item.clone().description,
    //                 notes: Some(Some(inputs.spending_item.clone().notes.unwrap_or_default())),
    //                 source_name: Some(Some(
    //                     user.firefly.unwrap().source_account.unwrap_or_default(),
    //                 )),
    //                 // source_name: Some(Some("Wealthsimple chequing".to_string())),
    //                 ..Default::default()
    //             }],
    //         },
    //         None,
    //     )
    //     .await
    //     {
    //         Ok(res) => res,
    //         Err(e) => {
    //             error!("{e:#?}");
    //             return Ok(AddTransactionResponseV2::GraphQLErrorObject(
    //                 GraphQlErrorObjectV2 {
    //                     code: AddSpendingItemByMonthError::FireflyUpdateFailed,
    //                     message: format!(
    //                         "Failed to create firfly transaction for user {}: {e}",
    //                         user.username
    //                     ),
    //                 },
    //             ));
    //         }
    //     };
    // }
    //
    // return Ok(AddTransactionResponseV2::SuccessResponse(
    //     AddTransactionV2SuccessResponse { success: true },
    // ));
}

#[cfg(test)]
mod tests {
    use anyhow::Result;
    use async_graphql::{EmptySubscription, InputType, Request, Schema, Variables, value};
    use chrono::Utc;
    use rust_decimal::Decimal;
    use sqlx::PgPool;
    use uuid::Uuid;

    use crate::{
        db::postgres::PostgresDB,
        graphql::{
            mutation::{MutationRoot, add_transaction_v2::AddTransactionV2Input},
            query::QueryRoot,
        },
        models::Transaction,
        month::Month,
        test_utils::mock_jwt,
    };

    #[sqlx::test]
    #[tracing_test::traced_test]
    async fn add_normal_transaction(pool: PgPool) -> Result<()> {
        let db = PostgresDB { pool };
        // let mut tx = db.transaction().await?;

        let query = r#"
mutation ($inputs: AddTransactionV2Input!) {
  addTransactionV2(inputs: $inputs) {
    success
  }
}
            "#;

        let mock_jwt = mock_jwt();
        let year = 2026;

        let month = Month::January;
        let schema = Schema::build(QueryRoot, MutationRoot, EmptySubscription).finish();
        let input = AddTransactionV2Input {
            year,
            month,
            transaction: Transaction {
                id: Uuid::new_v4(),
                amount: Decimal::new(100, 0),
                date: Utc::now().fixed_offset(),
                description: "test".to_string(),
                notes: "test".to_string(),
            },
        };

        let request = Request::new(query)
            .variables(Variables::from_value(value!({
                "inputs": input.to_value(),
            })))
            .data(mock_jwt)
            .data(db.clone());

        let res = schema.execute(request).await;
        assert!(res.errors.is_empty(), "{:#?}", res.errors);

        return Ok(());
    }

    // TODO: add other test cases
}
