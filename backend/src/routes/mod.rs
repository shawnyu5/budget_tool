use anyhow::anyhow;
use anyhow::Context;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::post;
use axum::{extract::Path, routing::get, Json, Router};
use common_axum::axum::{
    __path_app_version, app_version, attach_tracing_cors_middleware, AppError,
};
use mongodb::bson::doc;
use tracing::info;
use utoipa::OpenApi;

use crate::{
    db::{MonthlyBudget, DB},
    month::Month,
};

pub fn app() -> Router {
    let router = Router::new()
        .route("/", get(app_version))
        .route("/budget/:year/:month", get(get_month_budget_handler))
        .route("/budget/:year/:month", post(update_budget_handler));
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
        (status = 200, description = "The requested month's budget", body = MonthlyBudget),
        (status = 404, description = "The requested month does not have any budget recoreded", body = String),
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
    if year.len() != 4 {
        return Err(AppError(StatusCode::BAD_REQUEST, anyhow!("Invalid year")));
    }
    let db = DB::new(year)
        .await
        .context("Failed to connect to database")?;

    match db
        .collection
        .find_one(doc! {
            "month": month.to_string()
        })
        .await
        .context("Failed to query database")?
    {
        Some(month_spending) => return Ok(Json(month_spending)),
        None => {
            return Err(AppError(
                StatusCode::NOT_FOUND,
                anyhow!("Spending not found"),
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
    // TODO: extract year validation into a middleware
    if year.len() != 4 {
        return Err(AppError(StatusCode::BAD_REQUEST, anyhow!("Invalid year")));
    }

    let db = DB::new(year)
        .await
        .context("Failed to connect to database")?;

    let filter = doc! {
        "month": month.to_string()
    };
    dbg!(&body);
    let result = db
        .collection
        .replace_one(filter, body)
        .await
        .context("Failed to update monthly budget")?;

    info!("Replaced {} documents", result.matched_count);
    return Ok(());
}
