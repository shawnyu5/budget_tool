/// Domain models
use async_graphql::{InputObject, SimpleObject};
use chrono::{DateTime, FixedOffset};
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
#[graphql(name = "FireflySettingsV2")]
#[graphql(input_name = "FireflySettingsV2Input")]
pub struct FireflySettings {
    /// If the user has enabled Firefly integration
    pub enabled: bool,
    /// Encrypted firefly API key, required if `enabled` = true
    /// Must call `User.decrypt_firefly_api_key()` to get the decrypted version
    pub api_key: Option<String>,
    /// The source account to create the transaction in
    pub source_account: Option<String>,
}

/// Represent a single transaction
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, SimpleObject, Default, InputObject)]
#[graphql(input_name = "TransactionInput")]
pub struct Transaction {
    pub id: Uuid,
    pub amount: Decimal,
    pub date: DateTime<FixedOffset>,
    pub description: String,
    pub notes: String,
}

/// Data on the home screen
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, SimpleObject, Default, InputObject)]
pub struct HomePage {
    /// Total $ spend in this month
    pub total_spending: Decimal,
    /// Total allocated budget
    pub total_budget: Decimal,
    /// Amount that was over spent
    pub over_spending: Decimal,
    /// All transactions for this month
    pub transactions: Vec<Transaction>,
    /// Settings for the particular month
    pub settings: Settings,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, SimpleObject, Default, InputObject)]
#[graphql(input_name = "UserV2Input")]
#[graphql(name = "UserV2")]
pub struct User {
    pub username: String,
    // /// Notification subscription
    // pub notification_subscription: NotificationSubscription,
}
