use anyhow::Result;
use sqlx::{PgConnection, query, query_as};
use tracing::error;
use uuid::Uuid;

use crate::{
    db::postgres::{PostgresDB, models::notification_subscription::NotificationSubscriptionRow},
    routes::notification::{NotificationKeys, NotificationSubscription},
};

impl PostgresDB {
    /// Get a user's notification subscription
    ///
    /// Users can reject getting notifications send to them, so this will return an Option object
    pub async fn get_user_notification_subscription(
        &self,
        executor: &mut PgConnection,
        username: &str,
    ) -> Result<Option<NotificationSubscription>> {
        let notification_subscription = query_as!(
            NotificationSubscriptionRow,
            r#"
            SELECT
                n.id,
                n.user_id,
                n.endpoint,
                n.expiration_time,
                n.p256dh,
                n.auth
            FROM notification_subscription n
            INNER JOIN users u ON u.id = n.user_id
            WHERE
                u.username = $1
            "#,
            username
        )
        .fetch_optional(executor)
        .await
        .map_err(|e| {
            error!("{e:#?}");
            e
        })?;

        if let Some(notification_subscription) = notification_subscription {
            return Ok(Some(NotificationSubscription {
                endpoint: notification_subscription.clone().endpoint,
                expiration_time: notification_subscription.clone().expiration_time,
                keys: NotificationKeys {
                    p256dh: notification_subscription.clone().p256dh,
                    auth: notification_subscription.auth,
                },
            }));
        } else {
            return Ok(None);
        }
    }

    /// Updates a user's notification subscription
    pub async fn update_user_notification_subscription(
        &self,
        executor: &mut PgConnection,
        username: &str,
        endpoint: &str,
        expiration_time: Option<String>,
        p256dh: &str,
        auth: &str,
    ) -> Result<()> {
        query!(
            r#"
            INSERT INTO notification_subscription (id, user_id, endpoint, expiration_time, p256dh, auth)
            SELECT
                $1,
                u.id,
                $2,
                $3,
                $4,
                $5
            FROM users u
            WHERE u.username = $6
            ON CONFLICT (user_id)
            DO UPDATE SET
                endpoint = EXCLUDED.endpoint,
                p256dh = EXCLUDED.p256dh,
                auth = EXCLUDED.auth,
                expiration_time = EXCLUDED.expiration_time;
            "#,
            Uuid::new_v4(),
            endpoint,
            expiration_time,
            p256dh,
            auth,
            username,
        )
        .execute(executor)
        .await
        .map_err(|e| {
            error!("{e:#?}");
            e
        })?;

        Ok(())
    }
}
