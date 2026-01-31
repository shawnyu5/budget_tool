use crate::encryption::{decrypt, encrypt};
use crate::{db::DBError, routes::notification::NotificationSubscription};
use anyhow::Result;
use anyhow::{Context, anyhow};
use async_graphql::{InputObject, SimpleObject};
use chrono::Utc;
use futures::TryStreamExt;
use mongodb::{bson::doc, options::ReplaceOptions, results::UpdateResult};
use serde::{Deserialize, Serialize};
use tracing::{debug, info, instrument};
use utoipa::ToSchema;

use crate::db::DB;

/// Name of the user table in the DB
pub const USER_TABLE_NAME: &str = "Users";

/// Represents a user
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, ToSchema, SimpleObject, InputObject)]
#[graphql(input_name = "UserInput")]
#[serde(rename_all = "camelCase")]
pub struct User {
    /// Username of the user
    pub username: String,
    /// Notification subscription
    pub notification_subscription: NotificationSubscription,
    pub last_updated: Option<String>,
    pub firefly: Option<FireflySettings>,
}

impl User {
    /// Decrypt the firefly API key for the current user. Updates `self.firefly.api_key` with the decrypted value
    pub fn decrypt_firefly_api_key(&mut self) -> Result<()> {
        if let Some(firefly) = self.firefly.as_mut()
            && firefly.enabled
            && let (Some(api_key), Some(nonce)) =
                (firefly.api_key.as_mut(), firefly.encryption_nounce.as_ref())
        {
            info!("Decrypting API key...");
            let decrypted =
                decrypt(api_key, nonce).map_err(|e| anyhow!("Failed to decrypt API key: {e}"))?;

            *api_key = decrypted;
        }
        return Ok(());
    }

    /// Encrypts `api_key`. Updates `self.firefly.api_key` and `self.firefly.encryption_nounce`
    ///
    /// * `api_key`: the API key to encrypt
    pub fn encrypt_firefly_api_key(&mut self, api_key: &str) -> Result<()> {
        if let Some(firefly) = self.firefly.as_mut() {
            if firefly.enabled {
                let (secret, b64_nounce) =
                    encrypt(api_key).map_err(|e| anyhow!("Failed to encrypt API key: {e}"))?;
                firefly.api_key = Some(secret);
                firefly.encryption_nounce = Some(b64_nounce);
            } else {
                info!("Firefly integration disabled. Skip encrypting user API key");
            }
        }

        return Ok(());
    }
}

/// Firefly related settings
#[derive(
    Debug, Clone, PartialEq, Serialize, Deserialize, ToSchema, SimpleObject, Default, InputObject,
)]
#[graphql(input_name = "FireflySettingsInput")]
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

impl Default for User {
    fn default() -> Self {
        Self {
            username: Default::default(),
            notification_subscription: Default::default(),
            last_updated: Some(Utc::now().to_string()),
            firefly: Default::default(),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, ToSchema, SimpleObject, Default)]
#[serde(rename_all = "camelCase")]
pub struct UserCron {
    /// Name of cron
    pub name: String,
    /// Frequency of the cron job. Executed in the current time zone
    pub frequency: String,
}

impl DB<User> {
    /// Get a user by their user name
    ///
    /// * `username`: the user name to search for
    #[instrument(skip_all)]
    pub async fn get_user(&self, username: &str) -> Result<User, DBError> {
        let collection = self.collection.clone();
        match collection
            .find_one(doc! {
                "username": username,
            })
            .await
            .context("Failed to perform db query")?
        {
            Some(user) => {
                // TODO: need to decode the notification stuff before returning them
                debug!("Found user: {:?}", user);
                return Ok(user);
            }
            None => return Err(DBError::DB(anyhow!("Failed to look for user"))),
        };
    }

    /// Save a user information to the DB
    ///
    /// * `username`: Username of the user to update
    /// * `user`: the user whos info to save
    #[instrument(skip_all)]
    pub async fn save_user_info(
        &self,
        username: &str,
        user: &User,
    ) -> Result<UpdateResult, DBError> {
        let mut user = user.clone();
        user.last_updated = Some(Utc::now().to_string());

        let filter = doc! {
            "username": username,
        };

        let options = ReplaceOptions::builder().upsert(true).build();
        let result = self
            .collection
            .replace_one(filter.clone(), user)
            .with_options(options)
            .await
            .context("Failed to update user")?;

        info!("Modified {} document(s)", result.modified_count);

        #[cfg(debug_assertions)]
        {
            let found = self.collection.find(filter).await;
            debug_assert!(
                found.is_ok(),
                "There should be now one document in the DB after insertion"
            );
            debug_assert_eq!(
                found.iter().count(),
                1,
                "There should be only one record in DB with matching filter"
            );
        }

        return Ok(result);
    }

    #[instrument(skip_all)]
    /// Fetch all users in the DB
    pub async fn get_all_users(&self) -> Result<Vec<User>> {
        let collection = self.collection.clone();
        let mut cursor = collection.find(doc! {}).await?;
        let mut users = vec![];
        while let Some(user) = cursor.try_next().await? {
            users.push(user);
        }
        Ok(users)
    }
}
