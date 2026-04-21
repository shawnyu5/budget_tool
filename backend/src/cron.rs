use std::collections::HashMap;

use crate::{
    config::Config,
    db::{MongoDB, postgres::PostgresDB, users::USER_TABLE_NAME},
    routes::notification::NotificationBody,
};
use anyhow::{Context, Result};
use chrono_tz::America::Toronto;
use tokio_cron_scheduler::{Job, JobScheduler, job::job_data::Uuid};
use tracing::{debug, info};
use web_push::{
    ContentEncoding, IsahcWebPushClient, SubscriptionInfo, VapidSignatureBuilder, WebPushClient,
    WebPushMessageBuilder,
};

/// Initialize user crons for sending end of month notifications
pub async fn init_all_user_crons(scheduler: &JobScheduler) -> Result<HashMap<String, Uuid>> {
    let db = PostgresDB::new().await;
    let mut tx = db
        .transaction()
        .await
        .context("Failed to create DB transaction")?;

    let users = db
        .get_core_users(&mut tx)
        .await
        .context("Failed to get core users from DB")?;
    // let users = db.get_all_users().await.context("Failed to get users")?;
    let mut cron_job_ids = HashMap::new();

    for user in users {
        info!(
            "Initializing end of month Cron jobs for user {}",
            user.username
        );
        let notification = db
            .get_user_notification_subscription(&mut tx, &user.username)
            .await
            .context("Failed to get user notification subscription")?;

        if notification.is_none() {
            info!("User does not have notifications configured. Skipping sending notifications");
            continue;
        }
        let notification = notification.unwrap();

        let cron_id = scheduler
            .add(Job::new_async_tz(
                "0 0 21 L * *",
                Toronto,
                move |_uuid, _l| {
                    info!("Sending end of month notification");
                    let endpoint = notification.endpoint.clone();
                    let p256dh = notification.keys.p256dh.clone();
                    let auth = notification.keys.auth.clone();

                    // Need to clone here cuz we can't move user obj into the closure. We need to refer to it down below
                    Box::pin(async move {
                        send_notification(
                            &endpoint,
                            &p256dh,
                            &auth,
                            NotificationBody {
                                title: "Reminder: end of the month!".to_string(),
                                body: "Time to settle the budget 😊".to_string(),
                            },
                        )
                        .await
                        .expect("Failed to send user notification")
                    })
                },
            )?)
            .await?;
        cron_job_ids.insert(user.username, cron_id.into());
    }
    Ok(cron_job_ids)
}

/// Sends a web push notification
async fn send_notification(
    endpoint: &str,
    p256dh: &str,
    auth: &str,
    body: NotificationBody,
) -> Result<()> {
    let subscription_info = SubscriptionInfo::new(endpoint, p256dh, auth);
    let sig_builder =
        VapidSignatureBuilder::from_base64(&Config::load().vapid_private_key, &subscription_info)?
            .build()
            .context("Invalid VAPID configuration")?;

    // Now add payload and encrypt.
    let mut builder = WebPushMessageBuilder::new(&subscription_info);
    debug!("Notification payload: {:?}", body);

    let content = simd_json::to_vec(&body).context("Improper formatted notification body")?;
    builder.set_payload(ContentEncoding::Aes128Gcm, &content);
    builder.set_vapid_signature(sig_builder);

    let client = IsahcWebPushClient::new()?;

    // Finally, send the notification!
    let built = builder
        .build()
        .context("Failed to build notification payload")?;

    client
        .send(built)
        .await
        .context("Failed to send notification")?;
    Ok(())
}
