use axum::{routing::get, Router};
use common_axum::axum::{app_version, default_router};

pub fn app() -> Router {
    let router = default_router();
    let router = router.route("/", get(app_version));
    return router;
}
