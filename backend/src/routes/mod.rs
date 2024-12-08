use axum::{routing::get, Router};
use common_axum::axum::{app_version, attach_tracing_cors_middleware};

pub fn app() -> Router {
    let router = Router::new().route("/", get(app_version));
    return attach_tracing_cors_middleware(router);
}
