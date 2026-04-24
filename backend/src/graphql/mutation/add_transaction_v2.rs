use crate::config::Config;
use crate::db::postgres::PostgresDB;
use crate::db::postgres::models::Year;
use crate::db::postgres::models::transaction::SplitMode;
use crate::db::postgres::models::transaction::TransactionRow;
use crate::db::postgres::models::user::UserRow;
use crate::firefly::FireflyClient;
use crate::graphql::utils::extract_db_client;
use crate::graphql::utils::extract_jwt;
use crate::models::Transaction;
use crate::month::Month;
use crate::routes::notification::NotificationBody;
use crate::routes::notification::send_web_push_notification;
use anyhow::Context as AnhowContext;
use anyhow::Result;
use async_graphql::Context;
use async_graphql::InputObject;
use async_graphql::SimpleObject;
use chrono_tz::America::Toronto;
use rust_decimal::Decimal;
use sqlx::{Postgres, Transaction as DBTransaction};
use tracing::info;
use tracing::warn;
use tracing::{error, instrument};
use uuid::Uuid;

#[derive(InputObject, Debug)]
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
    let jwt = extract_jwt(ctx)?;
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
    let transactions = if total_spend < total_allocation
        && (total_spend + inputs.transaction.amount) > total_allocation
    {
        info!(
            "New transaction will go over budget of {total_allocation}. Splitting into 2 transactions..."
        );
        insert_overflow_transaction(db, &mut tx, &inputs, total_allocation, total_spend).await?
    } else if total_spend >= total_allocation {
        info!("Already over budget. Inserting transaction with SplitMode::Evenly");
        insert_over_budget_transaction(db, &mut tx, &inputs).await?
    } else {
        info!("New transaction will stay within budget. Adding transaction normally");
        insert_regular_transaction(db, &mut tx, &inputs).await?
    };

    let core_users = db
        .get_core_users(&mut tx)
        .await
        .context("Failed to get core users")?;
    let config = Config::load();

    for transaction in transactions {
        info!("Creating Firefly transaction: {:?}", transaction);
        let (shawn_split, maggie_split) = transaction
            .split_transaction(&mut tx)
            .await
            .context("Failed to split transaction")?
            .unwrap();

        for user in &core_users {
            let settings = db
                .get_user_firefly_settings(&mut tx, user.id)
                .await
                .context("Failed to get user firefly settings")?;

            let firefly_apikey = settings
                .decrypt_firefly_api_key()
                .context("Failed to decrypt API key")?;

            if !settings.enabled {
                info!(
                    "User {usename} has Firefly integration disabled. Skipping creating Firefly transaction",
                    usename = user.username
                );
                continue;
            }
            let firefly_client = FireflyClient::new(&firefly_apikey, &config.firefly_url);

            if user.username == "maggie" {
                firefly_client
                    .create_firefly_transaction(
                        db,
                        &mut tx,
                        Some(user.id),
                        transaction.id,
                        transaction.date.with_timezone(&Toronto),
                        maggie_split,
                        &transaction.description.clone().unwrap_or_default(),
                        &transaction.notes.clone().unwrap_or_default(),
                        &settings.source_account.unwrap_or_default(),
                    )
                    .await
                    .context("Failed to crete Firefly transaction")?;
            } else if user.username == "shawn" {
                firefly_client
                    .create_firefly_transaction(
                        db,
                        &mut tx,
                        Some(user.id),
                        transaction.id,
                        transaction.date.with_timezone(&Toronto),
                        shawn_split,
                        &transaction.description.clone().unwrap_or_default(),
                        &transaction.notes.clone().unwrap_or_default(),
                        &settings.source_account.unwrap_or_default(),
                    )
                    .await
                    .context("Failed to crete Firefly transaction")?;
            }
        }
    }

    // let users = core_users;
    let users: Vec<UserRow> = core_users
        .iter()
        .filter(|&user| user.username != jwt.username)
        .cloned()
        .collect();

    info!("Sending notification to users: {users:#?}");

    for user in users {
        let notification_subscription = db
            .get_user_notification_subscription(&mut tx, &user.username)
            .await?;
        if notification_subscription.is_none() {
            warn!(
                "User {} does not have notification subscriptions. Skipping",
                user.username
            );
            continue;
        }

        let notification_subscription = notification_subscription.unwrap();
        match send_web_push_notification(
            notification_subscription,
            NotificationBody {
                title: "Added new transaction!".to_string(),
                body: inputs.transaction.description.clone(),
            },
        )
        .await
        {
            Ok(_) => {}
            Err(e) => {
                error!("Failed to send web push notification: {e}");
            }
        };
    }

    tx.commit().await.context("Failed to commit transaction")?;
    Ok(AddTransactionResponseV2 { success: true })
}

#[instrument(skip_all)]
/// Add a regular transaction, splitting based on month's budget allocation
/// Return the transactions created in the DB
async fn insert_regular_transaction(
    db: &PostgresDB,
    tx: &mut DBTransaction<'_, Postgres>,
    inputs: &AddTransactionV2Input,
) -> Result<Vec<TransactionRow>> {
    let transaction_row = db
        .insert_new_transaction(
            tx,
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

    Ok(vec![transaction_row])
}

/// Insert new transaction when the current month is already over budget
#[instrument(skip_all)]
async fn insert_over_budget_transaction(
    db: &PostgresDB,
    tx: &mut DBTransaction<'_, Postgres>,
    inputs: &AddTransactionV2Input,
) -> Result<Vec<TransactionRow>> {
    let transaction_row = db
        .insert_new_transaction(
            tx,
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

    Ok(vec![transaction_row])
}

/// Current month is not over budget yet, but adding this new transaction will put the current month over budget, split it into 2 transactions
async fn insert_overflow_transaction(
    db: &PostgresDB,
    tx: &mut DBTransaction<'_, Postgres>,
    inputs: &AddTransactionV2Input,
    total_allocation: Decimal,
    total_spend: Decimal,
) -> Result<Vec<TransactionRow>> {
    // Track the 2 transactions we create here, so we can create the Firefly transaction at the end
    let mut transaction_rows = vec![];

    // $ amount for the first split
    // total_allocation = $100
    // amount = $20
    let regular_transaction_amount = total_allocation - total_spend;
    let overflow_transaction_amount = inputs.transaction.amount - regular_transaction_amount;
    info!("Inserting split 1 transaction. Amount = {regular_transaction_amount}");
    let transaction_row = db
        .insert_new_transaction(
            tx,
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
        db.compute_total_allocation(tx, inputs.year, inputs.month)
            .await?,
        db.compute_total_spend(tx, inputs.year, inputs.month)
            .await?,
        "At this point, total spend should == total allocation. Calculation is wrong if this is not the case"
    );
    transaction_rows.push(transaction_row);

    info!("Inserting overflow transaction. With amount {overflow_transaction_amount}");
    let transaction_row = db
        .insert_new_transaction(
            tx,
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
    transaction_rows.push(transaction_row);

    Ok(transaction_rows)
}

#[cfg(test)]
mod tests {
    use anyhow::{Context as _, Result};
    use async_graphql::{EmptySubscription, InputType, Request, Schema, Variables, value};
    use chrono::{SubsecRound, Utc};
    use rust_decimal::{Decimal, dec};
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
        let year = 2026;
        let month = Month::January;

        // let core_users = db.get_core_users(&mut tx).await?;
        // Split the budget 50/50
        // Each person contributing $50
        // let shawn_api_key = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiM2FiYWQ0ODcyMWUzYWRhNGUwMTQ4MWJlNjFhMmI4NTdjNDI1ZjgxNWMyZmJlYThmMDJjMDNlNmNlNWY2YzMwNDg5YmJlYzcwNWU1MjUzYTEiLCJpYXQiOjE3NzYwMjgzNTIuNzc4MDI1LCJuYmYiOjE3NzYwMjgzNTIuNzc4MDI4LCJleHAiOjE4MDc1NjQzNTIuNzI5Mjc4LCJzdWIiOiIxIiwic2NvcGVzIjpbXX0.BJ12IBi2pquUc1cDVGnrtJ-HIHUTNKBVAKJcrBJ-WTY7h8Prj76-wk8e41cvwF81aE7e2QnW82hMBNT599NDveiVpRxObYnssikkvo0U8W7oOKVC0BhRlVfj6105wbSw7jxVfpaM9QNh5FwirM4sOXVfjfGN8lz9IWFvisVBprhJ3cJlZn06o3l9LmU3M2VCiwYjKNNjfsbEKGjV7ifC0MV_hq4jyQUggFGcRiz4U6k1xYwwrt2VfRw4J7Kah6z1Dtn-M1a8CFR6nwlxXTdK1_B96hxGQxtQlsZemgK0RxtGBViA74DCCiJYXUcZ6CXTy8IwkMQrdWAgYzpb8l0YyxaNTuZLv9VLSFJxltSnsGJy0O-VtUGlN6V1Vgzj_UjvgHHiQgyQPqgkChx2j4fiwyIjRojT_Po8X6YlsY-PRvKhJ1wu3Ep8NIU8WncI8JXTLywnYnYRM18v4M33ieRMYa4omo3kOof0JFilE7V4ceHL8ZDwD6FlvYshR-3I9IWN3I5TlqXw7jguFS1kMG046wLJo0trJykDIlEI5pEPQLwjsh6p7dpTTnMQJrj5Gk-q7FReJgGR0UVqkTvPe-M2I_Pfig2l6m524Ws6V_Y4wA4em9sNWVkz1MKrN8w2r1LcnycQMAiYqPCHCNQDxLlcyKFr_eZazYsT8ym3GPputhc";
        //
        // for user in &core_users {
        //     db.insert_new_budget_allocation(&mut tx, year, month, user.id, dec!(50), dec!(50))
        //         .await?;
        //     if user.username == "shawn" {
        //         let (secret, b64_nounce) = encrypt(shawn_api_key)
        //             .map_err(|e| anyhow!("Failed to encrypt API key: {e}"))?;
        //
        //         db.update_user_firefly_settings(
        //             &mut tx,
        //             user.id,
        //             true,
        //             Some(secret),
        //             Some(b64_nounce),
        //             None,
        //         )
        //         .await?;
        //     }
        // }
        // tx.commit().await?;

        let query = r#"
mutation ($inputs: AddTransactionV2Input!) {
  addTransactionV2(inputs: $inputs) {
    success
  }
}
            "#;

        let mock_jwt = mock_jwt();
        let schema = Schema::build(QueryRoot, MutationRoot, EmptySubscription).finish();

        let id = Uuid::new_v4();
        let amount = dec!(100);
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
