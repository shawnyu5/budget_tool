use crate::{month::Month, routes::auth::decode_jwt};
use anyhow::{anyhow, Context};
use axum::{
    extract::{Path, Request},
    http::{HeaderMap, StatusCode},
    middleware::Next,
    response::IntoResponse,
};
use common_axum::app_error_v2::AppError;
use tracing::{error, info, instrument};

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
#[instrument(skip_all)]
pub async fn check_auth_header(
    header: HeaderMap,
    request: Request,
    next: Next,
) -> Result<impl IntoResponse, AppError> {
    let jwt_token = match header.get("authorization") {
        Some(auth_header) => {
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
    info!("Verifying JWT");
    let claim = match decode_jwt(&jwt_token) {
        Ok(e) => e,
        Err(e) => {
            error!("Failed to verify JWT token: {e}");
            return Err(AppError(StatusCode::FORBIDDEN, e));
        }
    };
    // let claim: JwtAccessToken = match jwt_token.to_string().verify_with_key(&key) {
    //     Ok(e) => e,
    //     Err(e) => {
    //         error!("Failed to verify JWT token");
    //         return Err(AppError(StatusCode::FORBIDDEN, e.into()));
    //     }
    // };
    info!("JWT verified");

    info!("Checking JWT expiration");
    // if claim.exp < Utc::now() {
    //     info!("JWT expired");
    //     return Err(AppError(
    //         StatusCode::UNAUTHORIZED,
    //         anyhow!("JWT expired, please authenticate"),
    //     ));
    // }
    info!("JWT not expired. Expiration date on {}", claim.exp);

    // decode_jwt(&jwt_token);

    return Ok(next.run(request).await);
}
