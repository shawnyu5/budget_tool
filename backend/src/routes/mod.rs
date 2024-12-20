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
use tracing::warn;
use utoipa_axum::router::OpenApiRouter;
use utoipa_axum::routes;

use crate::config::Config;
use crate::custom_middleware::{check_auth_header, check_valid_year};
use crate::db::DBError;
use crate::db::SpendingItem;
use crate::{
    db::{MonthlyBudget, DB},
    month::Month,
};

pub fn app() -> Router {
    let (budget_router, budget_api) = OpenApiRouter::new()
        .routes(routes!(get_month_budget_handler, update_budget_handler,))
        .split_for_parts();
    let budget_router = budget_router.layer(middleware::from_fn(check_valid_year));

    let (spending_item_router, spending_item_api) = OpenApiRouter::new()
        .routes(routes! {
            get_spending_item,
            update_spending_item
        })
        .split_for_parts();
    let spending_item_router = spending_item_router.layer(middleware::from_fn(check_valid_year));

    let (general_router, general_api) = OpenApiRouter::new()
        .routes(routes!(app_version))
        .split_for_parts();

    let (auth_router, auth_api) = OpenApiRouter::new()
        .routes(routes!(basic_auth_handler))
        .split_for_parts();

    let router = Router::new()
        .merge(budget_router)
        .merge(general_router)
        .merge(spending_item_router)
        .layer(middleware::from_fn(check_auth_header))
        .merge(auth_router);

    let mut merged_api = general_api
        .merge_from(budget_api)
        .merge_from(auth_api)
        .merge_from(spending_item_api);
    merged_api.info.title = "budget-tool backend".to_string();
    merged_api.info.description = None;
    merged_api.info.contact = None;
    merged_api.info.license = None;

    generate_open_api_spec_from_open_api(merged_api, "open_api_spec.json")
        .expect("Failed to generate open API spec");

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
#[instrument(skip_all)]
#[utoipa::path(
    get,
    path = "/budget/{year}/{month}",
    responses(
        (status = 200, description = "The requested month's budget. If the request month does not have any budget records, this route will iterate back till either no more months to check, a budget is encountered. The returned budget will have no spending, all the fields are correct, and matches the request", body = MonthlyBudget),
        (status = 401, description = "Authenication token expired. Please reauthenicate", body = String),
        (status = 403, description = "Authenication failed", body = String),
        (status = 404, description = "All months, the requested month and before does not contain any monthly budget", body = String),
        (status = 500, description = "Failed to get the requested month's budget", body = String),
    ),
    params(
        ("year" = String, description = "The year which to get the budget of"),
        ("month" = Month, description = "The month's budget to get. The first letter of the month's name is expected to the captalized. ie `January`")
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
#[instrument(skip_all)]
#[utoipa::path(
    post,
    request_body(
        content = MonthlyBudget, content_type = "application/json",
    ),
    path = "/budget/{year}/{month}",
    responses(
        (status = 200, description = "Successfully updated the month's budget", body = MonthlyBudget),
        (status = 401, description = "Authenication token expired. Please reauthenicate", body = String),
        (status = 403, description = "Authenication failed", body = String),
        (status = 500, description = "Failed to update the month's budget", body = String),
    ),
    params(
        ("year" = String, description = "The year which to get the budget of"),
        ("month" = Month, description = "The month's budget to get. The first letter of the month's name is expected to the captalized. ie `January`")
    )
)]
async fn update_budget_handler(
    Path((year, month)): Path<(String, Month)>,
    Json(body): Json<MonthlyBudget>,
) -> Result<impl IntoResponse, AppError> {
    // body.populate_spending_id();

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
        (status = 401, description = "Authenication token expired. Please reauthenicate", body = String),
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

    // Create a JWT for user
    let key: Hmac<Sha256> = Hmac::new_from_slice(&Config::load().private_key.into_bytes())?;
    let claim = JwtAccessToken {
        user: user.to_string(),
        expire: (Local::now() + Duration::hours(24)).into(),
    };
    let token_str = claim.sign_with_key(&key)?;

    return Ok(token_str);
}

/// Search for a spending item by time and ID
#[instrument(skip_all)]
#[utoipa::path(
    get,
    path = "/spending-item/{year}/{month}/{id}",
    responses(
        (status = 200, description = "The request spending item", body = MonthlyBudget),
        (status = 401, description = "Authenication token expired. Please reauthenicate", body = String),
        (status = 403, description = "Authenication failed", body = String),
        (status = 500, description = "Failed to get the requested spending item", body = String),
    ),
    params(
        ("year" = String, description = "The year the spending item is in"),
        ("month" = Month, description = "The month the spending item is in"),
        ("id" = String, description = "The ID of the spending item"),
    )
)]
async fn get_spending_item(
    Path((year, month, id)): Path<(String, Month, String)>,
) -> Result<Json<Option<SpendingItem>>, AppError> {
    let db = DB::new(year)
        .await
        .context("Failed to connect to database")?;

    let filter = doc! {
        "month": month.to_string(),
        "spending": {
            "$elemMatch": {
                "id": id.clone(),
            }
        }
    };

    let found = db
        .collection
        .find_one(filter)
        .await
        .context("Failed to look for spending item")?;

    if let Some(monthly_budget) = found {
        let spending_items: Vec<&SpendingItem> = monthly_budget
            .spending
            .par_iter()
            .filter(|spending| spending.id == id)
            .collect();
        debug_assert!(
            spending_items.len() == 1,
            "More than 1 spending items found. This should never happen. We are searching by ID"
        );

        // TODO: this should not be needed
        let mut spending_item = spending_items[0].clone();
        if spending_item.id.is_empty() {
            warn!("Spending item ID is empty, adding ID");
            spending_item.id = Local::now().to_string()
        }

        return Ok(Json(Some(spending_items[0].clone())));
    }
    info!("Filter matched no spending records");
    return Ok(Json(None));
}

/// Update a single spending item by ID in a specific year and month
#[instrument(skip_all)]
#[utoipa::path(
    post,
    path = "/spending-item/{year}/{month}/{id}",
    request_body(
        content = MonthlyBudget, content_type = "application/json",
    ),
    params(
        ("year" = String, description = "The year the spending item is in"),
        ("month" = Month, description = "The month the spending item is in"),
        ("id" = String, description = "The ID of the spending item to update"),
    ),
    responses(
        (status = 200, description = "The request spending item was Successfully updated"),
        (status = 401, description = "Authenication token expired. Please reauthenicate", body = String),
        (status = 403, description = "Authenication failed", body = String),
        (status = 500, description = "Failed to get update spending item", body = String),
    ),
)]
async fn update_spending_item(
    Path((year, month, id)): Path<(String, Month, String)>,
    Json(spending_item): Json<SpendingItem>,
) -> Result<(), AppError> {
    let db = DB::new(year)
        .await
        .context("Failed to connect to database")?;

    let mut monthly_budget = db
        .get_month_budget(month)
        .await
        .context("Failed to get budget for month {month}")?;

    // TODO: look into doing this without cloning
    info!("Looking for ID: {id}");
    let updated_monthly_spending: Vec<SpendingItem> = monthly_budget
        .spending
        .par_iter_mut()
        .map(|spending| {
            info!("Iteration ID: {}", spending.id);
            if spending.id == id {
                SpendingItem {
                    id: spending_item.id.clone(),
                    date: spending_item.date.clone(),
                    amount: spending_item.amount,
                    description: spending_item.description.clone(),
                    notes: spending_item.notes.clone(),
                }
            } else {
                spending.clone()
            }
        })
        .collect();
    monthly_budget.spending = updated_monthly_spending;
    let filter = doc! {
        "month": month.to_string()
    };

    let result = db
        .collection
        .replace_one(filter, monthly_budget)
        // .with_options(options)
        .await
        .context("Failed to update monthly budget")?;

    info!("Modified {} document(s)", result.modified_count);
    debug_assert!(
        result.modified_count == 1,
        "Should always modify a single document"
    );
    return Ok(());

    // let filter = doc! {
    //     "month": month.to_string(),
    //     "spending": {
    //         "$elemMatch": {
    //             "id": id.clone(),
    //         }
    //     }
    // };

    // // let updated_spending = SpendingItem {
    // //     id,
    // //     amount: spending_item.amount,
    // //     date: spending_item.date,
    // //     description: spending_item.description,
    // //     notes: spending_item.notes,
    // // };

    // let update_query = doc! {
    //     "$set": {
    //         "spending.$[elem].amount": spending_item.amount,
    //         "spending.$[elem].date": spending_item.date,
    //         "spending.$[elem].description": spending_item.description,
    //         "spending.$[elem].notes": spending_item.notes,
    //     }
    // };

    // let arr_filter = vec![doc! {
    //     "elem.id": spending_item.id
    // }];

    // let options = UpdateOptions::builder()
    //     .array_filters(Some(arr_filter))
    //     .build();

    // TODO: idk how to update...
    // let result = db
    //     .collection
    //     .update_one(filter, update_query, options)
    //     .await;
}
