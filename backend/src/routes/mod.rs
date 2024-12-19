use anyhow::anyhow;
use anyhow::Context;
use axum::http::{HeaderMap, StatusCode};
use axum::middleware;
use axum::response::IntoResponse;
use axum::{extract::Path, Json, Router};
use base64::prelude::BASE64_STANDARD;
use base64::Engine;
use chrono::{DateTime, Duration, Local, Utc};
use common_axum::app_error_v2::AppError;
use common_axum::axum::generate_open_api_spec_from_open_api;
use common_axum::axum::{__path_app_version, app_version, attach_tracing_cors_middleware};
use hmac::digest::KeyInit;
use hmac::Hmac;
use jwt::SignWithKey;
use mongodb::bson::doc;
use mongodb::options::ReplaceOptions;
use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use sha2::Sha256;
use tracing::info;
use tracing::instrument;
use utoipa_axum::router::OpenApiRouter;
use utoipa_axum::routes;

use crate::config::Config;
use crate::custom_middleware::{check_auth_header, check_valid_year};
use crate::db::DBError;
use crate::{
    db::{MonthlyBudget, DB},
    month::Month,
};

pub fn app() -> Router {
    let (budget_router, budget_api) = OpenApiRouter::new()
        .routes(routes!(get_month_budget_handler, update_budget_handler,))
        .split_for_parts();
    let budget_router = budget_router.layer(middleware::from_fn(check_valid_year));

    let (general_router, general_api) = OpenApiRouter::new()
        .routes(routes!(app_version))
        .split_for_parts();
    let general_router = general_router.layer(middleware::from_fn(check_auth_header));

    let (auth_router, auth_api) = OpenApiRouter::new()
        .routes(routes!(basic_auth_handler))
        .split_for_parts();

    let router = Router::new()
        .merge(budget_router)
        .merge(general_router)
        .merge(auth_router);

    let mut merged_api = general_api.merge_from(budget_api).merge_from(auth_api);
    merged_api.info.title = "budget-tool backend".to_string();
    merged_api.info.description = None;
    merged_api.info.contact = None;
    merged_api.info.license = None;

    generate_open_api_spec_from_open_api(merged_api, "open_api_spec.json")
        .expect("Failed to generate open API spec");

    // TODO: think about how this will work...
    // generate_open_api_spec("open_api_spec.json");

    // let (router, api) = OpenApiRouter::new().routes(routes!(
    //     get_month_budget_handler,
    //     update_budget_handler,
    //     app_version,
    //     login_handler
    // ));
    // let router = Router::new()
    //     .route("/budget/:year/:month", get(get_month_budget_handler))
    //     .route("/budget/:year/:month", post(update_budget_handler))
    //     .layer(middleware::from_fn(check_valid_year))
    //     .route("/", get(app_version))
    //     .layer(middleware::from_fn(check_auth_header))
    //     .route("/login/basic", post(login_handler));

    return attach_tracing_cors_middleware(router);
}

// #[derive(OpenApi)]
// #[openapi(paths(
//     app_version,
//     get_month_budget_handler,
//     update_budget_handler,
//     login_handler
// ))]
// pub struct APIDoc;

/// Get the budget information for a specific month
#[instrument]
#[utoipa::path(
    get,
    path = "/budget/{year}/{month}",
    responses(
        (status = 200, description = "The requested month's budget. If the request month does not have any budget records, this route will iterate back till either no more months to check, a budget is encountered. The returned budget will have no spending, all the fields are correct, and matches the request", body = MonthlyBudget),
        (status = 401, description = "User does not have access", body = String),
        (status = 403, description = "Authenication failed", body = String),
        (status = 404, description = "All months, the requested month and before does not contain any monthly budget", body = String),
        (status = 500, description = "Failed to get the requested month's budget", body = String),
    ),
    params(
        ("year" = String, description = "The year which to get the budget of"),
        ("month" = String, description = "The month's budget to get. The first letter of the month's name is expected to the captalized. ie `January`")
    )
)]
async fn get_month_budget_handler(
    Path((year, month)): Path<(String, Month)>,
) -> Result<impl IntoResponse, AppError> {
    let db = DB::new(year)
        .await
        .context("Failed to connect to database")?;

    match db.get_month_budget(month).await {
        Ok(monthly_budget) => return Ok(Json(monthly_budget)),
        Err(_) => {
            return Err(AppError(
                StatusCode::NOT_FOUND,
                DBError::BudgetNotFound.into(),
            ))
        }
    }
}

/// Update the budget for a specific month in a specific year
#[instrument(skip(body))]
#[utoipa::path(
    post,
    request_body(
        content = MonthlyBudget, content_type = "application/json",
    ),
    path = "/budget/{year}/{month}",
    responses(
        (status = 200, description = "Successfully updated the month's budget", body = MonthlyBudget),
        (status = 401, description = "User does not have access", body = String),
        (status = 403, description = "Authenication failed", body = String),
        (status = 500, description = "Failed to update the month's budget", body = String),
    ),
    params(
        ("year" = String, description = "The year which to get the budget of"),
        ("month" = String, description = "The month's budget to get. The first letter of the month's name is expected to the captalized. ie `January`")
    )
)]
async fn update_budget_handler(
    Path((year, month)): Path<(String, Month)>,
    Json(body): Json<MonthlyBudget>,
) -> Result<impl IntoResponse, AppError> {
    // // TODO: extract year validation into a middleware
    // if year.len() != 4 {
    //     return Err(AppError(StatusCode::BAD_REQUEST, anyhow!("Invalid year")));
    // }

    let db = DB::new(year)
        .await
        .context("Failed to connect to database")?;

    let filter = doc! {
        "month": month.to_string()
    };
    let options = ReplaceOptions::builder().upsert(true).build();
    let result = db
        .collection
        .replace_one(filter, body)
        .with_options(options)
        .await
        .context("Failed to update monthly budget")?;

    info!("Modified {} document(s)", result.modified_count);
    return Ok(());
}

#[derive(Serialize, Deserialize, Debug)]
pub struct JwtAccessToken {
    pub user: String,
    pub expire: DateTime<Utc>,
}

// TODO: implement an access / refresh token system later
// struct RefreshToken {
//     user: String,
//     expire: DateTime<Utc>,
//     token_id: String,
// }

#[instrument(skip_all)]
#[utoipa::path(post,
    path = "/login/basic",
    responses(
        (status = 200, description = "Login successful. Returns a JWT token", body = String),
        (status = 401, description = "User does not have access", body = String),
        (status = 403, description = "Authenication failed", body = String),
    )
)]
async fn basic_auth_handler(headers: HeaderMap) -> Result<String, AppError> {
    let config = Config::load();
    // The base64 decoded user
    let user = match headers.get("authorization") {
        Some(user) => {
            let auth_header_str = user
                .to_str()
                .context("Failed to convert auth header to string")?;
            let auth_user = auth_header_str.replace("Basic ", "");
            info!("base64 decoding user from auth header: {:?}", auth_user);

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

    let key: Hmac<Sha256> = Hmac::new_from_slice(&Config::load().private_key.into_bytes())?;
    let claim = JwtAccessToken {
        user: user.to_string(),
        expire: (Local::now() + Duration::hours(24)).into(),
    };
    let token_str = claim.sign_with_key(&key)?;

    return Ok(token_str);
}
