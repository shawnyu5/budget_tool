use async_graphql::SimpleObject;
use base64::{Engine, prelude::BASE64_STANDARD};

use crate::config::Config;

/// Frontend configuration
#[derive(Default, Clone, SimpleObject)]
pub struct FrontendConfig {
    /// Base 64 encoded public key used for encryption
    encryption_public_key: String,
    /// Non base 64 encoded VAPID public key used for sending notifications
    vapid_public_key: String,
}

pub async fn config_handler() -> FrontendConfig {
    let backend_config = Config::load();

    FrontendConfig {
        encryption_public_key: BASE64_STANDARD.encode(backend_config.public_key),
        vapid_public_key: backend_config.vapid_public_key,
    }
}
