#![allow(clippy::needless_return)]
mod config;
mod custom_middleware;
mod db;
mod month;
mod routes;

use anyhow::Result;
use common_axum::axum::{axum_serve, init_tracing_subcriber};
use config::Config;
use routes::app;
use tokio::net::TcpListener;
use tracing::info;

#[tokio::main]
async fn main() -> Result<()> {
    dotenvy::dotenv().ok();
    init_tracing_subcriber().expect("Failed to init tracing subscriber");
    info!("Generated Open API spec");
    // Attempt to load config. If it fails, dont bother starting the server
    Config::load();

    let addr = "0.0.0.0:8000";
    let listener = TcpListener::bind(addr).await.unwrap();
    info!("Listening on {}", addr);
    return axum_serve(listener, app()).await;
}
