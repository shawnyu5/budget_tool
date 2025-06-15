use crate::{db::DBError, routes::notification::NotificationSubscription};
use anyhow::{anyhow, Context};
use async_graphql::SimpleObject;
use mongodb::{bson::doc, options::ReplaceOptions, results::UpdateResult, Collection};
use serde::{Deserialize, Serialize};
use tracing::{debug, info, instrument};
use utoipa::ToSchema;

use crate::db::DB;

/// Represents a user
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, ToSchema, SimpleObject, Default)]
#[non_exhaustive]
#[serde(rename_all = "camelCase")]
pub struct User {
    /// Username of the user
    pub username: String,
    /// Notification subscription
    pub notification_subscription: NotificationSubscription,
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
    /// * `user`: the user whos info to save
    #[instrument(skip_all)]
    pub async fn save_user_info(&self, user: &User) -> Result<UpdateResult, DBError> {
        let filter = doc! {
            "username": user.username.clone(),
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
}
