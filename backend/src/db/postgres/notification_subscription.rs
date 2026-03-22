use anyhow::Result;
use sqlx::{PgConnection, query_as};
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
            endpoint: notification_subscription.endpoint.unwrap_or_default(),
            expiration_time: notification_subscription.expiration_time,
            keys: NotificationKeys {
                p256dh: notification_subscription
                    .keys
                    .as_ref()
                    .unwrap_or_default()
                    .p256dh,
                auth: notification_subscription
                    .keys
                    .as_ref()
                    .unwrap_or_default()
                    .auth,
            },
        });
    }
}
