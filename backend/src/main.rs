#![allow(clippy::needless_return)]
mod routes;

use anyhow::Result;
use common_axum::axum::{axum_serve, init_tracing_subcriber};
use routes::app;
use tokio::{net::TcpListener, signal};
use tracing::info;

#[tokio::main]
async fn main() -> Result<()> {
    init_tracing_subcriber().expect("Failed to init tracing subscriber");

    // generate_open_api_spec();
    let addr = "0.0.0.0:8000";
    let listener = TcpListener::bind(addr).await.unwrap();
    info!("Listening on {}", addr);
    return axum_serve(listener, app()).await;
}
