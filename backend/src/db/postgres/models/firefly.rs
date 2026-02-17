use sqlx::prelude::FromRow;
use uuid::Uuid;

#[derive(Debug, FromRow)]
pub struct Firefly {
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
