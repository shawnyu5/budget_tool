use crate::db::{users::USER_TABLE_NAME, DB};
use anyhow::{Context, Result};

/// Initialize all user crons
pub async fn init_all_user_crons() -> Result<()> {
    let db = DB::new(USER_TABLE_NAME).await?;
    let users = db.get_all_users().await.context("Failed to get users")?;
    // All users should by default come with a end of month reminder
    Ok(())
}
