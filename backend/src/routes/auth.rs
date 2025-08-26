use anyhow::Result;
use anyhow::{anyhow, Context};
use axum::extract::FromRequestParts;
use axum::http::request::Parts;
use axum::http::{HeaderMap, StatusCode};
use base64::prelude::*;
use chrono::{Duration, Utc};
use common_axum::app_error_v2::AppError;
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use rayon::iter::{IntoParallelRefIterator, ParallelIterator};
use tracing::{error, info, instrument};

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
            ));
        }
    };

    let username = user.split(":").collect::<Vec<&str>>()[0].to_string();
    let token = generate_jwt(&username);
    return Ok(token);
}

/// Generate a JWT token, containing a user name
///
/// * `username`: the user name to embed into the token
pub fn generate_jwt(username: &str) -> String {
    let key = EncodingKey::from_secret(&Config::load().private_key.into_bytes());
    let claim = JwtClaim {
        username: username.to_string(),
        exp: ((Utc::now() + Duration::hours(24)).timestamp() as usize),
    };
    return encode(&Header::default(), &claim, &key).unwrap();
}

pub fn decode_jwt(jwt: &str) -> Result<JwtClaim> {
    let validation = Validation::new(jsonwebtoken::Algorithm::HS256);
    let key = DecodingKey::from_secret(&Config::load().private_key.into_bytes());
    let token_data = decode::<JwtClaim>(jwt, &key, &validation)?;
    // dbg!(&token_data);

    return Ok(token_data.claims);
}

impl<S> FromRequestParts<S> for JwtClaim
where
    S: Send + Sync,
{
    type Rejection = StatusCode;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let jwt_token = match parts.headers.get("authorization") {
            Some(auth_header) => {
                let auth_header_str = auth_header
                    .to_str()
                    .context("Failed to convert authorization header to string")
                    .unwrap();

                if !auth_header_str.contains("Bearer") {
                    return Err(StatusCode::FORBIDDEN);
                }
                auth_header_str.replace("Bearer ", "")
            }
            None => {
                error!("Missing auth header....");
                return Err(StatusCode::FORBIDDEN);
            }
        };

        let claim = match decode_jwt(&jwt_token) {
            Ok(e) => e,
            Err(e) => {
                error!("Failed to verify JWT token: {e}");
                return Err(StatusCode::FORBIDDEN);
            }
        };

        return Ok(claim);
        // parts.extensions.get::<JwtClaim>().cloned().ok_or_else(|| {
        //     error!("Failed to exract JWT");
        //     StatusCode::UNAUTHORIZED
        // })
    }
}
