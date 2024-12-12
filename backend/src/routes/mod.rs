use anyhow::Context;
use axum::http::StatusCode;
use axum::middleware;
use axum::response::IntoResponse;
use axum::routing::post;
use axum::{extract::Path, routing::get, Json, Router};
use common_axum::axum::{
    __path_app_version, app_version, attach_tracing_cors_middleware, AppError,
};
use mongodb::bson::doc;
use mongodb::options::ReplaceOptions;
use tower::ServiceBuilder;
use tracing::info;
use utoipa::OpenApi;

use crate::custom_middleware::check_valid_year;
use crate::db::DBError;
use crate::{
    db::{MonthlyBudget, DB},
    month::Month,
};

pub fn app() -> Router {
    let router = Router::new()
        .route("/", get(app_version))
        .route("/budget/:year/:month", get(get_month_budget_handler))
        .route("/budget/:year/:month", post(update_budget_handler))
        .layer(ServiceBuilder::new().layer(middleware::from_fn(check_valid_year)));
    return attach_tracing_cors_middleware(router);
}

#[derive(OpenApi)]
#[openapi(paths(app_version, get_month_budget_handler, update_budget_handler))]
pub struct APIDoc;

/// Get the budget information for a specific month
#[utoipa::path(
    get,
    path = "/budget/{year}/{month}",
    responses(
        (status = 200, description = "The requested month's budget. If the request month does not have any budget records, this route will iterate back till either no more months to check, a budget is encountered. The returned budget will have no spending, all the fields are correct, and matches the request", body = MonthlyBudget),
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
#[utoipa::path(
    post,
    request_body(
        content = MonthlyBudget, content_type = "application/json",
    ),
    path = "/budget/{year}/{month}",
    responses(
        (status = 200, description = "Successfully updated the month's budget", body = MonthlyBudget),
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
    dbg!(&body);
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
