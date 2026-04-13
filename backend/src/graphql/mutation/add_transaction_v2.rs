use std::ops::Div;

use crate::config::Config;
use crate::db::postgres::models::Year;
use crate::db::postgres::models::transaction::SplitMode;
use crate::firefly::FireflyClient;
use crate::graphql::utils::extract_db_client;
use crate::models::Transaction;
use crate::month::Month;
use anyhow::Context as AnhowContext;
use anyhow::Result;
use async_graphql::Context;
use async_graphql::InputObject;
use async_graphql::SimpleObject;
use chrono_tz::America::Toronto;
use rust_decimal::dec;
use tracing::info;
use tracing::{error, instrument};
use uuid::Uuid;

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

    let core_users = db
        .get_core_users(&mut tx)
        .await
        .context("Faile to get core users")?;

    let config = Config::load();

    // If we are not over budget yet, and adding this new transaction will put us over budget, split it into 2 transactions
    if total_spend < total_allocation
        && (total_spend + inputs.transaction.amount) > total_allocation
    {
        info!(
            "New transaction will go over budget of {total_allocation}. Splitting into 2 transactions..."
        );
        // $ amount for the first split
        // total_allocation = $100
        // amount = $20
        let regular_transaction_amount = total_allocation - total_spend;
        let overflow_transaction_amount = inputs.transaction.amount - regular_transaction_amount;
        info!("Inserting split 1 transaction. Amount = {regular_transaction_amount}");
        db.insert_new_transaction(
            &mut tx,
            inputs.year,
            inputs.month,
            inputs.transaction.id,
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
            // Can't use `inputs.transaction.id`, since ID we used in split 1
            Uuid::new_v4(),
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
    } else if total_spend >= total_allocation {
        // We are already over budget
        info!("Already over budget. Inserting transaction with SplitMode::Evenly");
        db.insert_new_transaction(
            &mut tx,
            inputs.year,
            inputs.month,
            inputs.transaction.id,
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

        // Since transaction is being split evenly, create transaction with same amount for both users
        let amount = inputs.transaction.amount.div(dec!(2));
        for user in core_users {
            info!(
                "Creating transaction in firefly for user {} with amount {amount}",
                user.username
            );
            let firefly_settings = db
                .get_user_firefly_settings(&mut tx, user.id)
                .await
                .context("Failed to get user firefly settings")?;

            if !firefly_settings.enabled {
                info!("firefly integration disabled. Skipping creating firefly transaction");
            } else {
                let api_key = firefly_settings
                    .decrypt_firefly_api_key()
                    .context("Failed to decrypt Firefly API key")?;

                let firefly_client = FireflyClient::new(&api_key, &config.firefly_url);
                let transaction = inputs.transaction.clone();
                let firefly_transaction = firefly_client
                    .create_new_transaction(
                        transaction.date.with_timezone(&Toronto),
                        transaction.amount,
                        &transaction.description,
                        &transaction.notes,
                        &firefly_settings.source_account.unwrap_or_default(),
                    )
                    .await
                    .context("Failed to create firefly transaction")?;

                // Contains the link to the transaction in firefly
                // firefly_transaction.data.links.param_self;
                info!("Inserting Firefly transaction into DB");
                db.insert_firefly_transaction(
                    &mut tx,
                    inputs.transaction.id,
                    firefly_transaction.data.id,
                    firefly_transaction
                        .data
                        .links
                        .param_self
                        .unwrap_or_default(),
                )
                .await
                .context("Failed to insert firefly transaction into DB")?;
            }
        }
    } else {
        // Add transaction normally
        info!("New transaction will stay within budget. Adding transaction normally");
        let transaction_row = db
            .insert_new_transaction(
                &mut tx,
                inputs.year,
                inputs.month,
                inputs.transaction.id,
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

        let core_users = db
            .get_core_users(&mut tx)
            .await
            .context("Failed to get core users")?;

        let (shawn_split, maggie_split) = transaction_row
            .split_transaction(&mut tx)
            .await
            .context("Failed to split transaction")?
            .unwrap(); // Since we just inserted the transaction, it should always contain `SplitMode`. So this function not knowing how to split a budget is not a concern here

        for user in core_users {
            info!("Creating firefly transaction for user {}", user.username);

            let firefly_settings = db
                .get_user_firefly_settings(&mut tx, user.id)
                .await
                .context("Failed to get user firefly settings")?;

            if !firefly_settings.enabled {
                info!(
                    "{} has firefly setting disabled. Skipping creating Firefly transaction",
                    user.username
                );

                continue;
            }
            let firefly_apikey = firefly_settings
                .decrypt_firefly_api_key()
                .context("Failed to decrypt firefly API key")?;

            let firefly_client = FireflyClient::new(&firefly_apikey, &config.firefly_url);

            let transaction = inputs.transaction.clone();
            firefly_client
                .create_new_transaction(
                    transaction.date.with_timezone(&Toronto),
                    if user.username == "shawn" {
                        shawn_split
                    } else {
                        maggie_split
                    },
                    &transaction.description,
                    &transaction.notes,
                    &firefly_settings.source_account.unwrap_or_default(),
                )
                .await
                .context("Failed to create firefly transaction")?;
        }
    }

    tx.commit().await.context("Failed to commit transaction")?;

    Ok(AddTransactionResponseV2 { success: true })
}

#[cfg(test)]
mod tests {
    use anyhow::{Context as _, Result};
    use async_graphql::{EmptySubscription, InputType, Request, Schema, Variables, value};
    use chrono::{SubsecRound, Utc};
    use rust_decimal::Decimal;
    use sqlx::PgPool;
    use tracing::info;
    use uuid::Uuid;

    use crate::{
        db::postgres::{
            PostgresDB,
            models::transaction::{SplitMode, TransactionRow},
        },
        graphql::{
            mutation::{MutationRoot, add_transaction_v2::AddTransactionV2Input},
            query::QueryRoot,
        },
        models::Transaction,
        month::Month,
        test_utils::mock_jwt,
    };

    /// Add a transaction under normal circumstances. No overflow or over budget
    #[sqlx::test]
    #[tracing_test::traced_test]
    async fn add_normal_transaction(pool: PgPool) -> Result<()> {
        let db = PostgresDB { pool };

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

        let id = Uuid::new_v4();
        let amount = Decimal::new(100, 0);
        let date = Utc::now().fixed_offset().trunc_subsecs(6); // Rust can hold 3 more digits than Postgres, so we truncate
        let description = "test".to_string();
        let notes = "test".to_string();
        let input = AddTransactionV2Input {
            year,
            month,
            transaction: Transaction {
                id,
                amount,
                date,
                description: description.clone(),
                notes: notes.clone(),
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

        let mut tx = db.transaction().await?;
        let transaction = db
            .get_transactions(&mut tx, year, month)
            .await
            .context("Failed to get transaction from DB post test")?;

        assert_eq!(
            transaction.len(),
            1,
            "There should be no more than 1 transaction in DB, since there is no overflow here"
        );

        let transaction = &transaction[0];
        assert_eq!(transaction.id, id);
        assert_eq!(transaction.date, date);
        assert_eq!(transaction.amount, amount);
        assert_eq!(transaction.description, Some(description));
        assert_eq!(transaction.notes, Some(notes));

        return Ok(());
    }

    /// Add a transaction when we are at exact budget for the month
    /// The transaction we are adding will go over budget
    #[sqlx::test]
    #[tracing_test::traced_test]
    async fn add_overbudget_transaction(pool: PgPool) -> Result<()> {
        let db = PostgresDB { pool };
        let mut tx = db.transaction().await?;
        let year = 2026;
        let month = Month::January;
        let core_users = db.get_core_users(&mut tx).await?;
        info!("Inserting user contribution settings");
        for user in core_users {
            // Each person contributes $50
            // Total: $100
            db.insert_new_budget_allocation(
                &mut tx,
                year,
                month,
                user.id,
                Decimal::new(50, 0),
                Decimal::new(50, 0),
            )
            .await?;
        }

        assert_eq!(
            db.compute_total_allocation(&mut tx, year, month).await?,
            Decimal::new(100, 0)
        );

        info!("Inserting single transaction to max out budget");
        // Insert a new transaction to max out budget
        db.insert_new_transaction(
            &mut tx,
            year,
            month,
            Uuid::new_v4(),
            Decimal::new(100, 0),
            Utc::now().into(),
            "test",
            "test",
            Some(SplitMode::FromSettings),
        )
        .await?;

        tx.commit().await?;

        let query = r#"
mutation ($inputs: AddTransactionV2Input!) {
  addTransactionV2(inputs: $inputs) {
    success
  }
}
            "#;

        let mock_jwt = mock_jwt();
        let schema = Schema::build(QueryRoot, MutationRoot, EmptySubscription).finish();
        let description = "OVERFLOW";
        let input = AddTransactionV2Input {
            year,
            month,
            transaction: Transaction {
                id: Uuid::new_v4(),
                amount: Decimal::new(100, 0),
                date: Utc::now().into(),
                description: description.to_string(),
                notes: "test".to_string(),
            },
        };

        let request = Request::new(query)
            .variables(Variables::from_value(value!({
                "inputs": input.to_value(),
            })))
            .data(mock_jwt)
            .data(db.clone());

        info!("Making graphql call to insert over budget transaction");
        let res = schema.execute(request).await;
        assert!(res.errors.is_empty(), "{:#?}", res.errors);

        let mut tx = db.transaction().await?;
        let transactions = db.get_transactions(&mut tx, year, month).await?;
        assert_eq!(transactions.len(), 2, "There should only be 2 transactions");

        let transaction: Vec<&TransactionRow> = transactions
            .iter()
            .filter(|t| t.split_mode == Some(SplitMode::Evenly))
            .collect();

        assert_eq!(
            transaction.len(),
            1,
            "There should only be 1 overflow transaction after filtering"
        );

        let transaction = transaction[0];
        assert_eq!(
            transaction.split_mode,
            Some(SplitMode::Evenly),
            "Transaction should be split evenly"
        );
        return Ok(());
    }

    /// Add a transaction when budget for that month is not reached yet. Only adding new transaction will cause over budget
    /// Transaction should be split into 2 transactions
    #[sqlx::test]
    #[tracing_test::traced_test]
    async fn add_overflow_transaction(pool: PgPool) -> Result<()> {
        let db = PostgresDB { pool };
        let mut tx = db.transaction().await?;
        let year = 2026;
        let month = Month::January;
        let core_users = db.get_core_users(&mut tx).await?;
        info!("Inserting user contribution settings");
        for user in core_users {
            // Each person contributes $50
            // Total: $100
            db.insert_new_budget_allocation(
                &mut tx,
                year,
                month,
                user.id,
                Decimal::new(50, 0),
                Decimal::new(50, 0),
            )
            .await?;
        }

        info!("Inserting transaction with $90");
        db.insert_new_transaction(
            &mut tx,
            year,
            month,
            Uuid::new_v4(),
            Decimal::new(90, 0),
            Utc::now().into(),
            "test",
            "test",
            Some(SplitMode::FromSettings),
        )
        .await?;
        tx.commit().await?;

        let query = r#"
        mutation ($inputs: AddTransactionV2Input!) {
          addTransactionV2(inputs: $inputs) {
            success
          }
        }
                    "#;

        let mock_jwt = mock_jwt();
        let schema = Schema::build(QueryRoot, MutationRoot, EmptySubscription).finish();
        let description = "new";
        let input = AddTransactionV2Input {
            year,
            month,
            transaction: Transaction {
                id: Uuid::new_v4(),
                amount: Decimal::new(20, 0),
                date: Utc::now().into(),
                description: description.to_string(),
                notes: "test".to_string(),
            },
        };

        let request = Request::new(query)
            .variables(Variables::from_value(value!({
                "inputs": input.to_value(),
            })))
            .data(mock_jwt)
            .data(db.clone());

        info!("Making graphql request to insert overflow transaction. Amount: 20");
        let res = schema.execute(request).await;

        assert!(res.errors.is_empty());
        Ok(())
    }
}
