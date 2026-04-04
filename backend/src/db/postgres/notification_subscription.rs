use anyhow::Result;
use simd_json::serde::to_owned_value;
use sqlx::{PgConnection, query, query_as, types::Json};
use tracing::error;

use crate::{
    db::postgres::{PostgresDB, models::notification_subscription::NotificationSubscriptionRow},
    routes::notification::{NotificationKeys, NotificationSubscription},
};

impl PostgresDB {
    async fn get_user_notification_subscription(
        &self,
        executor: &mut PgConnection,
        username: &str,
    ) -> Result<NotificationSubscription> {
        let notification_subscription = query_as!(
            NotificationSubscriptionRow,
            r#"
            SELECT
                n.id,
                n.user_id,
                n.endpoint,
                n.expiration_time,
                n.keys AS "keys: sqlx::types::Json<NotificationKeys>"
            FROM notification_subscription n
            INNER JOIN users u ON u.id = n.user_id
            WHERE
                u.username = $1
            "#,
            username
        )
        .fetch_one(executor)
        .await
        .map_err(|e| {
            error!("{e:#?}");
            e
        })?;

        return Ok(NotificationSubscription {
            endpoint: notification_subscription
                .clone()
                .endpoint
                .unwrap_or_default(),
            expiration_time: notification_subscription.expiration_time,
            keys: NotificationKeys {
                p256dh: notification_subscription
                    .clone()
                    .keys
                    .unwrap_or(Json(NotificationKeys {
                        p256dh: "".to_string(),
                        auth: "".to_string(),
                    }))
                    .p256dh
                    .clone(),
                auth: notification_subscription
                    .clone()
                    .keys
                    .unwrap_or(Json(NotificationKeys {
                        p256dh: "".to_string(),
                        auth: "".to_string(),
                    }))
                    .auth
                    .clone(),
            },
        });
    }

    /// Updates a user's notification subscription
    ///
    /// * `executor`:
    /// * `username`:
    /// * `endpoint`:
    /// * `expiration_time`:
    /// * `keys`:
    async fn update_user_notification_subscription(
        &self,
        executor: &mut PgConnection,
        username: &str,
        endpoint: Option<String>,
        expiration_time: Option<i64>,
        keys: Option<Json<NotificationKeys>>,
    ) -> Result<()> {
        let keys_value = keys.unwrap_or_default().encode_to_string();
        // let keys_value =
        //     keys.map(|j| sqlx::Json to_owned_value(j.0).expect("Failed to serialize notification keys"));
        query!(
            r#"
            INSERT INTO notification_subscription (endpoint, expiration_time, keys)
            SELECT
                $2,
                $3,
                $4
            FROM users u
            WHERE u.username = $1
            "#,
            username,
            endpoint,
            expiration_time,
            keys
        )
        .execute(executor)
        .await
        .map_err(|e| {
            error!("{e:#?}");
            e
        });

        Ok(())
    }
}
