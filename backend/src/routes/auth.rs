use std::convert::Infallible;

use anyhow::Result;
use anyhow::{anyhow, Context};
use axum::extract::FromRequestParts;
use axum::http::request::Parts;
use axum::http::{HeaderMap, StatusCode};
use axum_extra::TypedHeader;
use base64::prelude::*;
use chrono::{Duration, Utc};
use common_axum::app_error_v2::AppError;
use headers::authorization::Basic;
use headers::Authorization;
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use rayon::prelude::*;
use tracing::{error, info, instrument, warn};

use crate::config::BasicAuth;
use crate::routes::MaybeJwt;
use crate::{config::Config, routes::JwtClaim};

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
                .context("Failed to base64 decode user from auth header")?;
            let decoded_auth_user = String::from_utf8(decoded_auth_user)
                .context("Failed to convert auth header to string")?;

            let user: Vec<BasicAuth> = config
                .basic_auth
                .into_par_iter()
                .filter(|s| format!("{}:{}", s.username, s.password) == decoded_auth_user)
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

            user[0].clone()
        }
        None => {
            return Err(AppError(
                StatusCode::FORBIDDEN,
                anyhow!("Missing authorization headers"),
            ));
        }
    };

    let token = generate_jwt(&user.username);
    return Ok(token);
}

#[instrument(skip_all)]
#[utoipa::path(post,
    path = "/login/basic/v2",
    responses(
        (status = 200, description = "Login successful. Returns a JWT token", body = String),
        (status = 401, description = "Authenication token expired. Please reauthenicate", body = String),
        (status = 403, description = "Authenication failed", body = String),
    )
)]
/// Better implemented version of the basic auth handler, using proper axum_extra constructs. This handler should behave the exact same as previous
pub async fn basic_auth_handler_v2(
    TypedHeader(auth): TypedHeader<Authorization<Basic>>,
) -> Result<String, AppError> {
    // pub async fn basic_auth_handler_v2(headers: HeaderMap) -> Result<String, AppError> {
    let config = Config::load();

    let user: Vec<BasicAuth> = config
        .basic_auth
        .into_par_iter()
        .filter(|s| s.username == auth.username() && s.password == auth.password())
        .collect();

    if user.is_empty() {
        return Err(AppError(
            StatusCode::FORBIDDEN,
            anyhow!("User does not have access"),
        ));
    }
    assert!(
                user.len() == 1,
                "There should be only one user that matched the authorization header. Something is wrong if there are multiple..."
            );
    let token = generate_jwt(auth.username());
    return Ok(token);
}

/// Generate a JWT token, containing a user name
///
/// * `username`: the user name to embed into the token
pub fn generate_jwt(username: &str) -> String {
    let key = EncodingKey::from_secret(&Config::load().private_key.into_bytes());
    let claim = JwtClaim {
        username: username.to_string(),
        exp: (Utc::now().checked_add_signed(Duration::hours(24)))
            .unwrap()
            .timestamp(),
    };
    return encode(&Header::default(), &claim, &key).unwrap();
}

pub fn decode_jwt(jwt: &str) -> Result<JwtClaim> {
    let validation = Validation::new(jsonwebtoken::Algorithm::HS256);
    let key = DecodingKey::from_secret(&Config::load().private_key.into_bytes());
    let token_data = decode::<JwtClaim>(jwt, &key, &validation)?;
    return Ok(token_data.claims);
}

impl<S> FromRequestParts<S> for MaybeJwt
where
    S: Send + Sync,
{
    type Rejection = Infallible;

    #[instrument(skip_all)]
    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        info!("Extracting JWT from Authorization header");
        let jwt_token = match parts.headers.get("authorization") {
            Some(auth_header) => {
                let auth_header_str = auth_header
                    .to_str()
                    .context("Failed to convert authorization header to string")
                    .unwrap();

                if !auth_header_str.contains("Bearer") {
                    return Ok(MaybeJwt(None));
                }
                auth_header_str.replace("Bearer ", "")
            }
            None => {
                warn!("Missing auth header....");
                return Ok(MaybeJwt(None));
            }
        };

        info!("Validating JWT");
        let claim = match decode_jwt(&jwt_token) {
            Ok(e) => {
                // TODO: need to make sure jwt is not expired
                info!("JWT exipration time: {time}", time = e.exp);
                e
            }
            Err(e) => {
                error!("Failed to verify JWT token: {e}");
                return Ok(MaybeJwt(None));
            }
        };

        return Ok(MaybeJwt(Some(claim)));
    }
}
