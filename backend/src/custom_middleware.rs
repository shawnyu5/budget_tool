use axum::{
    extract::{Path, Request},
    http::StatusCode,
    middleware::Next,
    response::IntoResponse,
};

use crate::month::Month;

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
