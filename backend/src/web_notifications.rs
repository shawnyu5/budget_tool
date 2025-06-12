use std::fs::File;

use anyhow::Result;
use axum::Json;
use common_axum::app_error_v2::AppError;
use serde::{Deserialize, Serialize};
use simd_json::json;
use utoipa::{PartialSchema, ToSchema};
use web_push::*;

use crate::config::{self, Config};

//  {
//    "endpoint": "https://fcm.googleapis.com/fcm/send/cKLbSNx4X18:APA91bEPNFK1I_pJ6tfe5BTql8raUMaW-vDKHwYGipD06Iummp0Zhw2Mrody8FuP_6EsaJ1EjG6ep9fd9i7ZHPFAkNgQL4ift1Hc8U7A2Q8AbTMDUIekivQfvMbqZlZOycE_qBrtkRUQ",
//    "expirationTime": null,
//    "keys": {
//       "p256dh": "BGFvx12kgLNajfUjS5nKJ9qjDcTFYbT8DYNVzOz7lEcmNxIdsMLiWfa0AGcYnH3qfPk287a2TFDkc3_8FQLm6IA",
//       "auth": "-AxK1mMvAj2fPynJe2e6pw"
//    }
// }

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct NotificationSendBody {
    pub endpoint: String,
    pub expiration_time: Option<String>,
    pub keys: NotificationKeys,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, ToSchema)]
pub struct NotificationKeys {
    pub p256dh: String,
    pub auth: String,
}

#[utoipa::path(post, path = "/notification/send", request_body (
    content = NotificationSendBody, content_type = "application/json",
) )]
pub async fn send_notification_handler(body: Json<NotificationSendBody>) -> Result<(), AppError> {
    let endpoint = &body.endpoint;
    let p256dh = &body.keys.p256dh;
    let auth = &body.keys.auth;

    let subscription_info = SubscriptionInfo::new(endpoint, p256dh, auth);
    let sig_builder =
        VapidSignatureBuilder::from_base64(&Config::load().vapid_private_key, &subscription_info)?
            .build()?;

    // Now add payload and encrypt.
    let mut builder = WebPushMessageBuilder::new(&subscription_info);
    // let content = "Encrypted payload to be sent in the notification".as_bytes();
    let content = simd_json::to_vec(&json!({
        "title": "HELLO WORLD",
        "body": "I AM ALIVEEE"
    }))?;
    builder.set_payload(ContentEncoding::Aes128Gcm, &content);
    builder.set_vapid_signature(sig_builder);

    let client = IsahcWebPushClient::new()?;

    // Finally, send the notification!
    let built = builder.build()?;
    dbg!(&built);
    client.send(built).await?;
    Ok(())
}

pub async fn send_push() -> Result<()> {
    let endpoint = "https://fcm.googleapis.com/fcm/send/ffG5cJ4OYuE:APA91bFEIVU6CjtHIUwgICVRnhPGovUSu0hVPpX5IU9ClgyIdMW2Q-6HvR1HGmd22wrnoRhAp9yCQYfJZkBVIj3dScb7HS7ry42AhxxVQvyC8Jhc7mGkbW9p62P1VayGRYcekj55Kd56";
    let p256dh =
        "BONXu8alqD57I04FuVZcqKJauT959H9heM38upW_6fMq50-mHJzODeBQBmpdny76AlT4YbnwJf-KovcQTg7BWWc";
    let auth = "FE4MUoCPBlclQIAcqBnsdw";

    // You would likely get this by deserializing a browser `pushSubscription` object.
    let subscription_info = SubscriptionInfo::new(endpoint, p256dh, auth);

    // Private key:
    // let file = "w8nw1gqxaOmSuQhtMmXY4fCUvZmvDnRQqURCL4_3U3s";
    // TODO: seems like this pem file does not match the one sent by the client...
    let file = File::open("private_notification.pem").unwrap();
    let mut sig_builder = VapidSignatureBuilder::from_pem(file, &subscription_info)?.build()?;

    // Now add payload and encrypt.
    let mut builder = WebPushMessageBuilder::new(&subscription_info);
    let content = "Encrypted payload to be sent in the notification".as_bytes();
    builder.set_payload(ContentEncoding::Aes128Gcm, content);
    builder.set_vapid_signature(sig_builder);

    let client = IsahcWebPushClient::new()?;

    // Finally, send the notification!
    client.send(builder.build()?).await?;
    Ok(())
}
// fn send_push(subscription: &SubscriptionInfo, payload: &str) -> Result<()> {
//     let mut builder = WebPushMessageBuilder::new(&subscription);
//     builder.set_payload(ContentEncoding::AesGcm, payload.as_bytes());

//     let vapid =
//         VapidSignatureBuilder::from_pem(include_bytes!("../vapid_private.pem")?, &subscription)
//             .add_claim("sub", "mailto:your@email.com")
//             .build()?;

//     builder.set_vapid_signature(vapid);
//     let client = WebPushClient::new()?;
//     client.send(builder.build()?)?;

//     Ok(())
// }
