use anyhow::anyhow;
use anyhow::Context;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::{debug_handler, extract::Path, routing::get, Json, Router};
use common_axum::axum::{
    __path_app_version, app_version, attach_tracing_cors_middleware, AppError,
};
use mongodb::bson::doc;
use utoipa::OpenApi;

use crate::{
    db::{MonthlySpending, YearlyBudget, DB},
    month::Month,
};

pub fn app() -> Router {
    let router = Router::new()
        .route("/", get(app_version))
        .route("/budget/:month", get(get_month_budget_handler));
    return attach_tracing_cors_middleware(router);
}

#[derive(OpenApi)]
#[openapi(paths(app_version, get_month_budget_handler))]
pub struct APIDoc;

/// Get the budget information for a specific month
#[utoipa::path(
    get,
    path = "/budget/{month}",
    responses(
        (status = 200, description = "The requested month's budget", body = MonthlySpending),
        (status = 404, description = "The requested month does not have any budget recoreded", body = String),
        (status = 500, description = "Failed to get the requested month's budget", body = String),
    ),
    params(
        ("month" = String, description = "The month's budget to get. The first letter of the month's name is expected to the captalized. ie `January`")
    )
)]
async fn get_month_budget_handler(Path(month): Path<Month>) -> Result<impl IntoResponse, AppError> {
    let db = DB::new().await.context("Failed to connect to database")?;
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
    // return Ok(monthly_spending);
}
