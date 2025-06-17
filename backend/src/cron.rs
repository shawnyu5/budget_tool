use std::collections::HashMap;

use crate::{
    config::Config,
    db::{users::USER_TABLE_NAME, DB},
    routes::notification::NotificationBody,
};
use anyhow::{Context, Result};
use tokio_cron_scheduler::{job::job_data::Uuid, Job, JobScheduler};
use tracing::{debug, info};
use web_push::{
    ContentEncoding, IsahcWebPushClient, SubscriptionInfo, VapidSignatureBuilder, WebPushClient,
    WebPushMessageBuilder,
};

/// Initialize all user crons
pub async fn init_all_user_crons(scheduler: &JobScheduler) -> Result<HashMap<String, Uuid>> {
    let db = DB::new(USER_TABLE_NAME).await?;
    let users = db.get_all_users().await.context("Failed to get users")?;
    let mut cron_job_ids = HashMap::new();

    for user in users.clone() {
        info!(
            "Initializing end of month Cron jobs for user {}",
            user.username
        );

        let username = user.username.clone();
        let cron_id = scheduler
            .add(Job::new_async_tz(
                "0 0 21 L * *",
                chrono_tz::America::New_York,
                move |_uuid, _l| {
                    // Job::new_async_tz("0 0 0 L * *", chrono_tz::America::New_York, |_uuid, _l| {
                    info!("Sending end of month notification");
                    let endpoint = user.notification_subscription.endpoint.clone();
                    let p256dh = user.notification_subscription.keys.p256dh.clone();
                    let auth = user.notification_subscription.keys.auth.clone();
                    dbg!(&endpoint, &p256dh, &auth);

                    let username_clone = username.clone();
                    Box::pin(async move {
                        let db = DB::new(USER_TABLE_NAME)
                            .await
                            .expect("Failed to connect to user DB");
                        let user = db
                            .get_user(&username_clone)
                            .await
                            .expect("Failed to get user");

                        send_notification(
                            &user.notification_subscription.endpoint,
                            &user.notification_subscription.keys.p256dh,
                            &user.notification_subscription.keys.auth,
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
