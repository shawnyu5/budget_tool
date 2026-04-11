use anyhow::Result;
use anyhow::anyhow;
use chrono::{DateTime, Utc};
use chrono_tz::{America::New_York, Tz};
use firefly_client::models::{TransactionSplitStore, TransactionStore, TransactionTypeProperty};
use reqwest::header::ACCEPT;
use rust_decimal::Decimal;
use tracing::error;

pub struct FireflyClient {
    /// Firefly API key
    api_key: String,
    /// URL to firefly instance
    firefly_url: String,
    http_client: reqwest::Client,
}

impl FireflyClient {
    /// Create a new Firefly client
    ///
    /// * api_key - Firefly API key
    /// * firefly_url - URL to firefly instance
    pub fn new(api_key: &str, firefly_url: &str) -> Self {
        // Tell firefly it can return errors in JSON format, rather than auto redirecting to firefly home page
        let mut headers = reqwest::header::HeaderMap::new();
        headers.insert(
            ACCEPT,
            reqwest::header::HeaderValue::from_static("application/json"),
        );

        let http_client = reqwest::Client::builder()
            .default_headers(headers)
            .build()
            .expect("Failed to build reqwest client");
        Self {
            api_key: api_key.to_string(),
            firefly_url: firefly_url.to_string(),
            http_client,
        }
    }

    /// Create a new transaction in Firefly
    ///
    /// * `date`: the date of the transaction. Date should be in EST timezone
    /// ```rust
    ///    let dt_est = Utc::now().with_timezone(&Toronto);
    /// ```
    /// * `amount`: amount of the transaction
    /// * `description`: description of the transaction
    /// * `notes`: notes in the transaction
    /// * `source_account`: source account of the transaction
    pub async fn create_new_transaction(
        &self,
        date: DateTime<Tz>,
        amount: Decimal,
        description: &str,
        notes: &str,
        source_account: &str,
    ) -> Result<()> {
        match firefly_client::apis::transactions_api::store_transaction(
            &firefly_client::apis::configuration::Configuration {
                base_path: self.firefly_url.clone(),
                client: self.http_client.clone(),
                bearer_access_token: Some(self.api_key.clone()),
                ..Default::default()
            },
            TransactionStore {
                error_if_duplicate_hash: Some(false),
                apply_rules: Some(true),
                fire_webhooks: Some(true),
                group_title: None,
                transactions: vec![TransactionSplitStore {
                    r#type: TransactionTypeProperty::Withdrawal,
                    date: date.to_rfc3339(),
                    amount: amount.to_string(),
                    description: description.to_string(),
                    notes: Some(Some(notes.to_string())),
                    source_name: Some(Some(source_account.to_string())),
                    ..Default::default()
                }],
            },
            None,
        )
        .await
        {
            Ok(res) => res,
            Err(e) => {
                error!("{e:#?}");
                return Err(anyhow!("Failed to create firefly transaction"));
            }
        };
        Ok(())
    }
}
