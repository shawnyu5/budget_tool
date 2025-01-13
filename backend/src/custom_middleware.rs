use anyhow::{anyhow, Context};
use axum::{
    extract::{Path, Request},
    http::{HeaderMap, StatusCode},
    middleware::Next,
    response::IntoResponse,
};
use chrono::Utc;
use common_axum::app_error_v2::AppError;
use hmac::{digest::KeyInit, Hmac};
use jwt::VerifyWithKey;
use sha2::Sha256;
use tracing::{error, info};

use crate::{config::Config, month::Month, routes::JwtAccessToken};

/// Checks the year in the path. Returns 400 if the year is invalid
pub async fn check_valid_year(
    Path((year, _month)): Path<(String, Month)>,
    request: Request,
    next: Next,
) -> Result<impl IntoResponse, StatusCode> {
    if year.len() != 4 {
        error!("Invalid year");
        return Err(StatusCode::BAD_REQUEST);
    }
    return Ok(next.run(request).await);
}

/// checks for the JWT token in the authorization header, and ensures it is not expired. If it is, return 401 unauthorized
pub async fn check_auth_header(
    header: HeaderMap,
    request: Request,
    next: Next,
) -> Result<impl IntoResponse, AppError> {
    let jwt_token = match header.get("authorization") {
        Some(auth_header) => {
            info!("Auth header: {:?}", auth_header);
            let auth_header_str = auth_header
                .to_str()
                .context("Failed to convert authorization header to string")?;

            if !auth_header_str.contains("Bearer") {
                return Err(AppError(
                    StatusCode::FORBIDDEN,
                    anyhow!("Missing bearer token"),
                ));
            }
            auth_header_str.replace("Bearer ", "")
        }
        None => {
            error!("Missing auth header");
            return Err(AppError(
                StatusCode::FORBIDDEN,
                anyhow!("Missing authorization header"),
            ));
        }
    };
    info!("Got JWT token from authorization header: {jwt_token}");
    let key: Hmac<Sha256> = Hmac::new_from_slice(&Config::load().private_key.into_bytes())
        .context("Failed to parse private key")?;

    info!("Verifying JWT");
    let claim: JwtAccessToken = match jwt_token.to_string().verify_with_key(&key) {
        Ok(e) => e,
        Err(e) => {
            error!("Failed to verify JWT token");
            return Err(AppError(StatusCode::FORBIDDEN, e.into()));
        }
    };
    // // TODO: failing to verify token should return FORBIDDEN
    // .context("Failed to verify JWT token")?;
    info!("JWT verified");

    info!("Checking JWT expiration");
    if claim.expire < Utc::now() {
        info!("JWT expired");
        return Err(AppError(
            StatusCode::UNAUTHORIZED,
            anyhow!("JWT expired, please authenticate"),
        ));
    }
    info!("JWT not expired. Expiration date on {}", claim.expire);

    return Ok(next.run(request).await);
}
