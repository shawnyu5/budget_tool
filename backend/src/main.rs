#![allow(clippy::needless_return)]
mod config;
mod custom_middleware;
mod db;
mod month;
mod routes;

use anyhow::Result;
use common_axum::axum::{axum_serve, generate_open_api_spec, init_tracing_subcriber};
use routes::{app, APIDoc};
use tokio::net::TcpListener;
use tracing::info;

#[tokio::main]
async fn main() -> Result<()> {
    init_tracing_subcriber().expect("Failed to init tracing subscriber");
    generate_open_api_spec::<APIDoc>("open_api_spec.json")
        .expect("Failed to generate open API spec");
    info!("Generated Open API spec");

    let addr = "0.0.0.0:8000";
    let listener = TcpListener::bind(addr).await.unwrap();
    info!("Listening on {}", addr);
    return axum_serve(listener, app()).await;
}
