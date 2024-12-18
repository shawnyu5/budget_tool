use anyhow::{anyhow, Context};
use axum::{
    extract::{Path, Request},
    http::{HeaderMap, StatusCode},
    middleware::Next,
    response::IntoResponse,
};
use chrono::Utc;
use common_axum::axum::AppError;
use hmac::{digest::KeyInit, Hmac};
use jwt::{SignWithKey, VerifyWithKey};
use sha2::Sha256;
use tracing::{info, instrument};

use crate::{config::Config, month::Month, routes::JwtAccessToken};

pub async fn check_valid_year(
    Path((year, _month)): Path<(String, Month)>,
    request: Request,
    next: Next,
) -> Result<impl IntoResponse, StatusCode> {
    if year.len() != 4 {
        return Err(StatusCode::BAD_REQUEST);
    }
    return Ok(next.run(request).await);
}

/// checks for the JWT token in the authorization header, and ensures it is not expired. If it is, return 401 unauthorized
#[instrument(skip_all)]
pub async fn check_auth_header(
    header: HeaderMap,
    request: Request,
    next: Next,
) -> Result<impl IntoResponse, AppError> {
    let jwt_token = match header.get("authorization") {
        Some(token) => token,
        None => {
            return Err(AppError(
                StatusCode::FORBIDDEN,
                anyhow!("Missing authorization header"),
            ));
        }
    };
    info!("Got authorization header");

    let key: Hmac<Sha256> = Hmac::new_from_slice(&Config::load().private_key.into_bytes())
        .context("Failed to parse private key")?;

    info!("Verifying JWT");
    let claim: JwtAccessToken = jwt_token
        .to_str()?
        .to_string()
        .verify_with_key(&key)
        // TODO: failing to verify token should return FORBIDDEN
        .context("Failed to verify JWT token")?;
    info!("JWT verified");

    info!("Checking JWT expiration");
    if claim.expire < Utc::now() {
        info!("JWT expired");
        return Err(AppError(
            StatusCode::UNAUTHORIZED,
            anyhow!("JWT expired, please authenticate"),
        ));
    }

    return Ok(next.run(request).await);
}
