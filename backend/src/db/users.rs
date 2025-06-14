use crate::{db::DBError, routes::notification::NotificationSubscription};
use anyhow::{anyhow, Context};
use mongodb::bson::doc;
use serde::{Deserialize, Serialize};
use tracing::info;
use utoipa::ToSchema;

use crate::db::DB;

/// Represents a user
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, ToSchema)]
#[non_exhaustive]
#[serde(rename_all = "camelCase")]
pub struct User {
    /// Username of the user
    username: String,
    /// Notification subscription
    notification_subscription: NotificationSubscription,
}

impl DB<User> {
    /// Get a user by their user name
    ///
    /// * `username`: the user name to search for
    pub async fn get_user(&self, username: &str) -> Result<(), DBError> {
        let collection = self.collection.clone();
        match collection
            .find_one(doc! {
                "user": username,
            })
            .await
            .context("Failed to perform db query")?
        {
            Some(user) => {
                // return Ok(user)
                dbg!(&user);
                return Ok(());
            }
            None => return Err::<(), DBError>(DBError::DB(anyhow!("Failed to look for user"))),
        };
    }

    /// Save a user information to the DB
    ///
    /// * `user`: the user to save
    pub async fn save_user(&self, user: &User) -> Result<(), DBError> {
        let filter = doc! {
            "user": user.username.clone(),
        };

        let result = self
            .collection
            .replace_one(filter, user)
            .await
            .context("Failed to update user")?;

        info!("Modified {} document(s)", result.modified_count);

        return Ok(());
    }
}
