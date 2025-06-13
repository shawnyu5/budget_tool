use anyhow::{anyhow, Context};
use axum::http::{HeaderMap, StatusCode};
use base64::prelude::*;
use chrono::{Duration, Local};
use common_axum::app_error_v2::AppError;
use hmac::{digest::KeyInit, Hmac};
use jwt::SignWithKey;
use rayon::iter::{IntoParallelRefIterator, ParallelIterator};
use sha2::Sha256;
use tracing::{info, instrument};

use crate::{config::Config, routes::JwtAccessToken};

#[instrument(skip_all)]
#[utoipa::path(post,
    path = "/login/basic",
    responses(
        (status = 200, description = "Login successful. Returns a JWT token", body = String),
        (status = 401, description = "Authenication token expired. Please reauthenicate", body = String),
        (status = 403, description = "Authenication failed", body = String),
    )
)]
pub async fn basic_auth_handler(headers: HeaderMap) -> Result<String, AppError> {
    let config = Config::load();
    // The base64 decoded user / password pair
    let user = match headers.get("authorization") {
        Some(user) => {
            let auth_header_str = user
                .to_str()
                .context("Failed to convert auth header to string")?;
            let auth_user = auth_header_str.replace("Basic ", "");
            let decoded_auth_user = BASE64_STANDARD
                .decode(auth_user)
                .context("Failed to decode user from auth header")?;
            let decoded_auth_user = String::from_utf8(decoded_auth_user)
                .context("Failed to convert auth header to string")?;

            let user: Vec<&String> = config
                .basic_auth
                .par_iter()
                .filter(|s| *s == &decoded_auth_user)
                .collect();
            if user.is_empty() {
                return Err(AppError(
                    StatusCode::FORBIDDEN,
                    anyhow!("User does not have access"),
                ));
            }
            assert!(
                user.len() == 1,
                "There should be only one user that matched the authorizatio header. Something is wrong if there are multiple..."
            );

            user[0]
        }
        None => {
            return Err(AppError(
                StatusCode::FORBIDDEN,
                anyhow!("Missing authorization headers"),
            ))
        }
    };

    let username = user.split(":").collect::<Vec<&str>>()[0].to_string();
    // Create a JWT for user
    let key: Hmac<Sha256> = Hmac::new_from_slice(&Config::load().private_key.into_bytes())?;
    let claim = JwtAccessToken {
        user: username,
        expire: (Local::now() + Duration::hours(24)).into(),
    };
    let token_str = claim.sign_with_key(&key)?;

    return Ok(token_str);
}
