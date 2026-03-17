use std::{collections::HashMap, pin::Pin};

use crate::{
    db::{
        MongoDB,
        migration_table::{MIGRATIONS_TABLE_NAME, SchemaMigration},
        postgres::PostgresDB,
    },
    month::Month,
};
use anyhow::{Context, Result};
use chrono::{DateTime, NaiveDate, NaiveTime};
use chrono_tz::America::New_York;
use rust_decimal::{Decimal, prelude::FromPrimitive};
use tracing::{error, info, instrument};
use uuid::Uuid;

/// Perform all schema migrations
#[instrument(skip_all)]
pub async fn do_mongo_migrations() -> Result<()> {
    type MigrationFunc =
        Box<dyn Fn() -> Pin<Box<dyn Future<Output = anyhow::Result<()>> + Send>> + Send + Sync>;

    let mut migrations: HashMap<SchemaMigration, MigrationFunc> = HashMap::new();
    migrations.insert(
        SchemaMigration::new(
            "add_date_rfc3339_field",
            1,
            "add `dateRfc3339` field to all spending items",
        ),
        Box::new(|| Box::pin(add_date_rfc3339_field())),
    );
    migrations.insert(
        SchemaMigration::new("migrate_to_postgres", 1, "Migrate all data to postgres"),
        Box::new(|| Box::pin(migrate_to_postgres())),
    );

    let migration_table = MongoDB::new(MIGRATIONS_TABLE_NAME).await?;
    for migration in migrations {
        info!("Executing migration {}", &migration.0.id);
        let existing_migration = migration_table
            .find_by_id(&migration.0.id)
            .await
            .context("Failed to search migration table")?;

        if let Some(migration) = existing_migration {
            info!(
                "Migration already applied on date {}. Skipping",
                migration.applied
            );
            continue;
        }

        match (migration.1)().await {
            Ok(_) => {
                info!("Migration completed successfully!");
                info!("Adding migration record in DB");
                let migration_db = MongoDB::new(MIGRATIONS_TABLE_NAME).await?;
                migration_db
                    .add_new_migration_record(migration.0)
                    .await
                    .context("Failed to add migration record to DB")?;
            }
            Err(e) => error!("Migration failed: {e}"),
        };
    }
    Ok(())
}

/// Migrate all data to Postgres
#[instrument]
async fn migrate_to_postgres() -> Result<()> {
    let postgres = PostgresDB::new().await;
    let mut tx = postgres
        .transaction()
        .await
        .context("Failed to create transaction")?;

    for year in [2025, 2026] {
        let mongo = MongoDB::new(&year.to_string()).await?;
        #[allow(clippy::never_loop)]
        for month in [
            Month::January,
            Month::February,
            Month::March,
            Month::April,
            Month::May,
            Month::June,
            Month::July,
            Month::August,
            Month::September,
            Month::October,
            Month::November,
            Month::December,
        ] {
            info!("Inserting new Month row in Postgres for year {year} month {month}");
            let month_row = postgres
                .insert_new_month(year, month)
                .await
                .with_context(|| format!("Failed to insert month row for month {month}"))?;

            info!("Getting previous month budget from Mongo");
            let mongo_month_budget = mongo.get_month_budget(month).await?;

            info!("Getting core users from Postgres");
            let core_users = postgres.get_core_users(&mut *tx).await?;
            for user in core_users {
                if user.username == "shawn" {
                    info!("Inserting budget_allocation for user shawn for {year} {month}");
                    postgres
                        .insert_new_budget_allocation(
                            &mut tx,
                            year,
                            month,
                            user.id,
                            Decimal::from_f64(
                                mongo_month_budget.budget.shawn_percentage_allocation,
                            )
                            .unwrap(),
                            Decimal::from_f64(mongo_month_budget.budget.shawn_contribution_amount)
                                .unwrap(),
                        )
                        .await?;
                } else if user.username == "maggie" {
                    info!("Inserting budget_allocation for user maggie for {year} {month}");
                    postgres
                        .insert_new_budget_allocation(
                            &mut tx,
                            year,
                            month,
                            user.id,
                            Decimal::from_f64(
                                mongo_month_budget.budget.maggie_percentage_allocation,
                            )
                            .unwrap(),
                            Decimal::from_f64(mongo_month_budget.budget.maggie_contribution_amount)
                                .unwrap(),
                        )
                        .await?;
                }
            }

            info!("Inserting new transaction into Postgres");
            for transaction in mongo_month_budget.spending {
                postgres
                    .insert_new_transaction(
                        &mut tx,
                        month_row.year,
                        month_row.month,
                        Uuid::new_v4(),
                        Decimal::from_f64_retain(transaction.amount).expect(
                            "Failed to convert mongo transaction amount into rust_decimal amount",
                        ),
                        DateTime::parse_from_rfc3339(&transaction.date_rfc3339.unwrap()).unwrap(),
                        &transaction.description,
                        &transaction.notes.unwrap_or_default(),
                        None,
                    )
                    .await?;
            }
        }
    }

    tx.commit().await.context("Failed to commit transaction")?;
    Ok(())
}

/// Adds date_rfc3339 field to all transaction dates
#[instrument]
async fn add_date_rfc3339_field() -> Result<()> {
    for year in [2024, 2025, 2026] {
        let db = MongoDB::new(&year.to_string()).await?;
        for month in [
            Month::January,
            Month::February,
            Month::March,
            Month::April,
            Month::May,
            Month::June,
            Month::July,
            Month::August,
            Month::September,
            Month::October,
            Month::November,
            Month::December,
        ] {
            let mut budget = db
                .get_month_budget(month)
                .await
                .context("Failed to get month budget")?;

            budget.spending.iter_mut().for_each(|spend| {
                let parsed_date = match NaiveDate::parse_from_str(&spend.date, "%Y/%m/%d") {
                    Ok(d) => d,
                    Err(e) => {
                        error!("Failed to parse date {}: {e}... Moving on", spend.date);
                        return;
                    }
                };
                let datetime = parsed_date
                    .and_time(NaiveTime::MIN)
                    .and_local_timezone(New_York)
                    .unwrap();

                let rfc_3339 = datetime.to_rfc3339();
                info!("Parsed date in RFC 3339 format: {rfc_3339}");
                spend.date_rfc3339 = Some(rfc_3339);
            });

            db.update_monthly_budget(month, &budget)
                .await
                .context("Failed to save updated schema in DB")?;
        }
    }

    Ok(())
}
