use crate::config::Config;
use anyhow::{Context, Result};
use axum::Json;
use common_axum::app_error_v2::AppError;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use web_push::*;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct NotificationSendBody {
    /// Data sent by the browser to do the handshake for the notification
    pub subscription: NotificationSubscription,
    /// The body of the notification
    pub body: NotificationBody,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, ToSchema)]
pub struct NotificationBody {
    pub title: String,
    pub body: String,
}
/// Stuff the browser sends to do the notification handshake
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct NotificationSubscription {
    pub endpoint: String,
    pub expiration_time: Option<String>,
    pub keys: NotificationKeys,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, ToSchema)]
pub struct NotificationKeys {
    pub p256dh: String,
    pub auth: String,
}

// #[utoipa::path(post, path = "/notification/save-subscription")]
/// Send a notification
#[utoipa::path(post, path = "/notification/send", request_body (
    content = NotificationSendBody, content_type = "application/json",
) )]
pub async fn send_notification_handler(body: Json<NotificationSendBody>) -> Result<(), AppError> {
    let endpoint = &body.subscription.endpoint;
    let p256dh = &body.subscription.keys.p256dh;
    let auth = &body.subscription.keys.auth;

    let subscription_info = SubscriptionInfo::new(endpoint, p256dh, auth);
    let sig_builder =
        VapidSignatureBuilder::from_base64(&Config::load().vapid_private_key, &subscription_info)?
            .build()?;

    // Now add payload and encrypt.
    let mut builder = WebPushMessageBuilder::new(&subscription_info);
    let content = simd_json::to_vec(&body.body).context("Inproper formatted notification body")?;
    builder.set_payload(ContentEncoding::Aes128Gcm, &content);
    builder.set_vapid_signature(sig_builder);

    let client = IsahcWebPushClient::new()?;

    // Finally, send the notification!
    let built = builder.build()?;
    dbg!(&built);
    client.send(built).await?;
    Ok(())
}
