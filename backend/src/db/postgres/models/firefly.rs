use anyhow::Result;
use anyhow::anyhow;
use sqlx::prelude::FromRow;
use tracing::info;
use tracing::instrument;
use uuid::Uuid;

use crate::{encryption::encrypt, models::FireflySettings};

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
    /// Encrypts `api_key`. Updates `self.firefly.api_key` and `self.firefly.encryption_nounce`
    ///
    /// * `api_key`: the API key to encrypt
    #[instrument[skip_all]]
    pub fn encrypt_firefly_api_key(&mut self, api_key: &str) -> Result<()> {
        if self.enabled {
            let (secret, b64_nounce) =
                encrypt(api_key).map_err(|e| anyhow!("Failed to encrypt API key: {e}"))?;
            self.api_key = Some(secret);
            self.encryption_nounce = Some(b64_nounce);
            info!("Secret: {:?}", self.api_key);
            info!("Encryption nounce: {:?}", self.encryption_nounce);
        } else {
            info!("Firefly integration disabled. Skip encrypting user API key");
        }

        return Ok(());
    }
}
