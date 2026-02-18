#![allow(clippy::needless_return)]
use anyhow::{Context, Result};
use backend::db::postgres::PostgresDB;
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

    PostgresDB::new()
        .await
        .do_migrations()
        .await
        .context("Migration failed...")?;

    let addr = "0.0.0.0:8000";
    let listener = TcpListener::bind(addr).await.unwrap();
    info!("Listening on {}", addr);
    return axum_serve(listener, app().await).await;
}
