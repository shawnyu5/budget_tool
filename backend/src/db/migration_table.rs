use anyhow::{Context, Result};
use chrono::Utc;
use chrono_tz::America::New_York;
use mongodb::bson::doc;
use serde::{Deserialize, Serialize};

use crate::db::DB;

/// Name of the schema migration table in DB
/// This table keeps track of all the schema migrations that were done
pub const MIGRATIONS_TABLE_NAME: &str = "schema_migrations";

/// Represent a single schema migration
#[derive(Serialize, Deserialize, Eq, Hash, PartialEq, PartialOrd)]
pub struct SchemaMigration {
    /// ID of the migration
    pub id: String,
    /// version of the migration
    pub version: i16,
    /// Description of the migration
    pub description: String,
    /// Date this was applied
    pub applied: String,
}

impl SchemaMigration {
    /// Create a new schema migration
    ///
    /// * `id`: the ID of the migration. This must be unique
    /// * `version`: version of the migration
    /// * `description`: description of the migration
    pub fn new(id: &str, version: i16, description: &str) -> SchemaMigration {
        return SchemaMigration {
            id: id.to_string(),
            version,
            description: description.to_string(),
            applied: Utc::now().with_timezone(&New_York).to_rfc3339(),
        };
    }
}

impl DB<SchemaMigration> {
    /// Add a new schema migration
    pub async fn add_new_migration_record(&self, migration: SchemaMigration) -> Result<()> {
        self.collection
            .insert_one(migration)
            .await
            .context("Failed to insert migration record to DB")?;
        Ok(())
    }

    /// Find a migration by its ID.
    ///
    /// * `id`: the ID / name of the migration
    pub async fn find_by_id(&self, id: &str) -> Result<Option<SchemaMigration>> {
        self.collection
            .find_one(doc! {
                "id": id
            })
            .await
            .context("Failed to execute find in DB")
    }
}
