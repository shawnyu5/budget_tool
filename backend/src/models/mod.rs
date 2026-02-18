/// Domain models
use async_graphql::{InputObject, SimpleObject};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Data on the settings page
#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize, SimpleObject, InputObject)]
#[graphql(input_name = "SettingInput")]
pub struct Settings {
    /// Total allocated budget
    pub total_allocation: Decimal,
    /// Shawn percentage allocation
    pub shawn_percentage_allocation: Decimal,
    /// Shawn contribution amount. The frontend is responsible for computing this value
    pub shawn_contribution_amount: Decimal,
    /// Maggie percentage allocation
    pub maggie_percentage_allocation: Decimal,
    /// Maggie contribution amount. The frontend is responsible for computing this value
    pub maggie_contribution_amount: Decimal,
    /// Firefly related settings
    pub firefly: FireflySettings,
}
/// Firefly related settings
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, SimpleObject, Default, InputObject)]
#[graphql(input_name = "FireflySettingsV2Input")]
pub struct FireflySettings {
    /// If the user has enabled Firefly integration
    pub enabled: bool,
    /// Encrypted firefly API key, required if `enabled` = true
    /// Must call `User.decrypt_firefly_api_key()` to get the decrypted version
    pub api_key: Option<String>,
    /// Base64 encoded nounce used to encrypt / decrypt the API key
    pub encryption_nounce: Option<String>,
    /// The source account to create the transaction in
    pub source_account: Option<String>,
}
