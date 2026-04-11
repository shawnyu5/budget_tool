use anyhow::Result;
use anyhow::anyhow;
use sqlx::prelude::FromRow;
use tracing::info;
use uuid::Uuid;

use crate::encryption::decrypt;

#[derive(Debug, FromRow)]
pub struct FireflyRow {
    pub id: Uuid,
    pub user_id: Uuid,
    /// If firefly integration is enabled
    pub enabled: bool,
    /// Encrypted API key
    // TODO: use secret data type here
    pub api_key: Option<String>,
    /// Nounce used for encryption / decryption
    pub encryption_nounce: Option<String>,
    /// Source account to create user transaction in
    pub source_account: Option<String>,
}

impl FireflyRow {
    /// Decrypt the Firefly API key stored in this database row, and return the decrypted key
    /// If firefly integration is not enabled, decryption will be skipped and `None` will be returned.
    pub fn decrypt_firefly_api_key(&self) -> Result<Option<String>> {
        // If firefly integration is not enabled, dont bother decrypting
        if !self.enabled {
            return Ok(None);
        }

        let (Some(api_key), Some(nonce)) = (&self.api_key, &self.encryption_nounce) else {
            return Ok(None);
        };

        info!("Decrypting API key...");
        let decrypted =
            decrypt(api_key, nonce).map_err(|e| anyhow!("Failed to decrypt API key: {e}"))?;
        return Ok(Some(decrypted));
    }
}
