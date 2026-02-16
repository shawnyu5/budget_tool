#![allow(clippy::needless_return)]
use anyhow::Result;
use backend::routes::app;
use backend::{config::Config, db::migrations::do_db_migrations};
use common_axum::axum::{axum_serve, init_tracing_subcriber};
use tokio::net::TcpListener;
use tracing::info;

#[tokio::main]
async fn main() -> Result<()> {
    dotenvy::dotenv().ok();
    init_tracing_subcriber().expect("Failed to init tracing subscriber");
    // Attempt to load config. If it fails, dont bother starting the server
    Config::load();

    do_db_migrations()
        .await
        .expect("DB schema migration failed....");
    // info!("Starting DB migration...");
    // add_date_rfc3339_field()
    //     .await
    //     .context("DB migration add_date_rfc3999_field failed...")?;

    let addr = "0.0.0.0:8000";
    let listener = TcpListener::bind(addr).await.unwrap();
    info!("Listening on {}", addr);
    return axum_serve(listener, app().await).await;
}
