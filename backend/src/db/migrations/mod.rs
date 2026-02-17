use std::{collections::HashMap, pin::Pin};

use crate::{
    db::{
        MongoDB,
        migration_table::{MIGRATIONS_TABLE_NAME, SchemaMigration},
    },
    month::Month,
};
use anyhow::{Context, Result};
use chrono::{NaiveDate, NaiveTime};
use chrono_tz::America::New_York;
use tracing::{error, info, instrument};

/// Perform all schema migrations
#[instrument(skip_all)]
pub async fn do_db_migrations() -> Result<()> {
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
            Ok(_) => info!("Migration completed successfully!"),
            Err(e) => error!("Migration failed: {e}"),
        };
    }
    Ok(())
}

/// Adds date_rfc3339 field to all transaction dates
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

    let migration_db = MongoDB::new(MIGRATIONS_TABLE_NAME).await?;
    migration_db
        .add_new_migration_record(SchemaMigration::new(
            "add_date_rfc3339_field",
            1,
            "add `dateRfc3339` field to all spending items",
        ))
        .await?;

    Ok(())
}
