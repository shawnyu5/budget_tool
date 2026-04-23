use anyhow::Context;
use anyhow::Result;
use anyhow::anyhow;
use chrono::DateTime;
use chrono_tz::Tz;
use firefly_client::apis::transactions_api::UpdateTransactionError;
use firefly_client::models::NotFoundResponse;
use firefly_client::models::TransactionSingle;
use firefly_client::models::TransactionSplitUpdate;
use firefly_client::models::UserSingle;
use firefly_client::models::{TransactionSplitStore, TransactionStore, TransactionTypeProperty};
use reqwest::header::ACCEPT;
use rust_decimal::Decimal;
use sqlx::Postgres;
use sqlx::Transaction;
use tracing::error;
use tracing::info;
use tracing::instrument;
use tracing::warn;
use uuid::Uuid;

use crate::config::Config;
use crate::db::postgres::PostgresDB;

/// Client for making calls to Firefly
pub struct FireflyClient {
    // /// Firefly API key
    // api_key: String,
    // /// URL to firefly instance
    // firefly_url: String,
    /// Firefly API configuration
    firefly_api_configuration: firefly_client::apis::configuration::Configuration,
    // http_client: reqwest::Client,
}

impl FireflyClient {
    /// Create a new Firefly client
    ///
    /// * api_key - Firefly API key
    /// * firefly_url - URL to firefly instance. `/api` is appended to this URL
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
            // api_key: api_key.to_string(),
            // firefly_url: format!("{}/api", firefly_url),
            // firefly_url: firefly_url.to_string(),
            // http_client,
            firefly_api_configuration: firefly_client::apis::configuration::Configuration {
                base_path: format!("{}/api", firefly_url),
                client: http_client,
                bearer_access_token: Some(api_key.to_string()),
                ..Default::default()
            },
        }
    }

    /// Create a new transaction in Firefly, and the corresponding DB entry
    ///
    /// * `db`: the PostgresDB connection
    /// * `tx`: the current DB transaction
    /// * `user_id`: the user this firefly transaction is associated with
    /// * `tranaction_id`: the transaction ID of this app, NOT firefly
    /// * `date`: the date of the transaction. Date should be in EST timezone
    /// ```rust
    /// use chrono::Utc;
    /// use chrono_tz::America::Toronto;
    /// let dt_est = Utc::now().with_timezone(&Toronto);
    /// ```
    /// * `amount`: amount of the transaction
    /// * `description`: description of the transaction
    /// * `notes`: notes in the transaction
    /// * `source_account`: source account of the transaction
    #[allow(clippy::too_many_arguments)]
    pub async fn create_new_transaction(
        &self,
        db: &PostgresDB,
        tx: &mut Transaction<'_, Postgres>,
        user_id: Option<Uuid>,
        transaction_id: Uuid,
        date: DateTime<Tz>,
        amount: Decimal,
        description: &str,
        notes: &str,
        source_account: &str,
    ) -> Result<TransactionSingle> {
        let transaction = match firefly_client::apis::transactions_api::store_transaction(
            &self.firefly_api_configuration,
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
            Ok(res) => {
                info!("Inserting Firefly transaction into DB");
                let config = Config::load();
                db.insert_firefly_transaction(
                    tx,
                    user_id,
                    transaction_id,
                    res.data.id.clone(),
                    format!("{}/transactions/show/{}", config.firefly_url, res.data.id),
                )
                .await
                .context("Failed to insert firefly transaction into DB")?;
                res
            }
            Err(e) => {
                error!("{e:#?}");
                return Err(anyhow!("Failed to create firefly transaction"));
            }
        };

        Ok(transaction)
    }

    pub async fn list_accounts(&self) -> Result<Vec<String>> {
        let accounts = match firefly_client::apis::accounts_api::list_account(
            &self.firefly_api_configuration,
            None,
            Some(50),
            Some(1),
            None,
            None,
            None,
            Some(firefly_client::models::AccountTypeFilter::AssetAccount),
        )
        .await
        {
            Ok(a) => a,
            Err(e) => {
                error!("Failed to retrieve firefly user accounts: {:#?}", e);
                return Err(anyhow!("Failed to retrieve user firefly accounts: {e}"));
            }
        };

        let account_names = accounts
            .data
            .into_iter()
            .map(|a| a.attributes.name)
            .collect();

        Ok(account_names)
    }

    /// Get info about the current Firefly user
    pub async fn get_current_user(&self) -> Result<UserSingle> {
        match firefly_client::apis::about_api::get_current_user(
            &self.firefly_api_configuration,
            None,
        )
        .await
        {
            Ok(user) => Ok(user),
            Err(e) => {
                error!("Failed to list current user: {e}");
                return Err(anyhow!("Failed to list current user"));
            }
        }
    }

    /// Retrieve a Firefly transaction by its Firefly ID
    ///
    /// * `firefly_transaction_id`: firefly transaction ID
    pub async fn get_transaction_by_id(
        &self,
        firefly_transaction_id: &str,
    ) -> Result<TransactionSingle> {
        let transaction = firefly_client::apis::transactions_api::get_transaction(
            &self.firefly_api_configuration,
            firefly_transaction_id,
            None,
        )
        .await
        .context("Failed to get transaction from Firefly")?;

        Ok(transaction)
    }

    /// Updates a Firefly transaction by its ID
    ///
    /// * `firefly_transaction_id`: Firefly transaction ID
    /// * `transaction_update`: the new transaction spec
    ///
    /// If the Firefly transaction is not found, it will be ignored. All other error responses returned by Firefly will be returned as Err response
    #[instrument(skip_all)]
    pub async fn update_transaction_by_id(
        &self,
        firefly_transaction_id: &str,
        transaction_update: firefly_client::models::TransactionUpdate,
    ) -> Result<()> {
        match firefly_client::apis::transactions_api::update_transaction(
            &self.firefly_api_configuration,
            firefly_transaction_id,
            transaction_update,
            None,
        )
        .await
        {
            Ok(_) => {
                info!("Transaction updated successfully")
            }
            Err(firefly_client::apis::Error::ResponseError(e)) => match &e.entity {
                Some(UpdateTransactionError::Status422(ValidationErrorResponse))
                    if ValidationErrorResponse.message.clone()
                        == Some("Resource not found".to_string()) =>
                {
                    warn!("Updating Firefly transaction: transaction not found");
                    info!("{e:?}");
                    return Ok(());
                }
                _ => {
                    error!("Got unknown Firefly error: {e:#?}");
                    return Err(anyhow!("{e:#?}"));
                }
            },
            Err(e) => return Err(anyhow!("{e:#?}")),
        };
        Ok(())
    }

    /// Delete a Firefly transaction
    ///
    /// * `firefly_transaction_id`: Firefly transaction ID
    pub async fn delete_firefly_transaction(&self, firefly_transaction_id: &str) -> Result<()> {
        firefly_client::apis::transactions_api::delete_transaction(
            &self.firefly_api_configuration,
            firefly_transaction_id,
            None,
        )
        .await
        .context("Failed to delete Firefly transaction")?;

        Ok(())
    }
}
