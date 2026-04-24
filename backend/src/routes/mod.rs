use std::ops::Deref;

use anyhow::Context;
use async_graphql_axum::GraphQLRequest;
use async_graphql_axum::GraphQLResponse;
use axum::extract::State;
use axum::http::HeaderMap;
use axum::http::StatusCode;
use axum::middleware;
use axum::response::IntoResponse;
use axum::{Router, extract::Path};
use common_axum::app_error_v2::AppError;
use common_axum::axum::generate_open_api_spec_from_open_api;
use common_axum::axum::{__path_app_version, app_version, attach_tracing_cors_middleware};
use serde::{Deserialize, Serialize};
use tokio_cron_scheduler::JobScheduler;
use tracing::debug;
use tracing::error;
use tracing::info;
use tracing::instrument;
use utoipa::PartialSchema;
use utoipa_axum::router::OpenApiRouter;
use utoipa_axum::routes;

use crate::cron::init_all_user_crons;
use crate::custom_middleware::check_auth_header;
use crate::db::postgres::PostgresDB;
use crate::db::postgres::models::Year;
use crate::graphql::SchemaType;
use crate::graphql::generate_graphql_schema;
use crate::month::Month;
use crate::routes::auth::basic_auth_handler_v2;
use crate::routes::auth::decode_jwt;
use crate::routes::auth::{
    __path_basic_auth_handler, __path_basic_auth_handler_v2, basic_auth_handler,
};
use crate::routes::notification::{__path_send_notification_handler, send_notification_handler};
pub mod auth;
pub mod notification;

pub async fn app() -> Router {
    let graphql_schema = generate_graphql_schema().expect("Failed to generate graphql schema");

    let _cron_ids = match JobScheduler::new().await {
        Ok(sched) => {
            let cron_ids = init_all_user_crons(&sched).await.unwrap();
            sched.shutdown_on_ctrl_c();
            match sched.start().await {
                Ok(_) => {}
                Err(_) => {
                    error!("Failed to start cron job for all users")
                }
            }
            Ok(cron_ids)
        }
        Err(e) => {
            error!("Failed to initalize cron job scheduler: {e}");
            Err(e)
        }
    };

    let (mut router, mut api_spec) = OpenApiRouter::new()
        .routes(routes!(validate_token))
        .routes(routes!(validate_token_v2))
        .routes(routes!(export_csv_handler))
        .layer(middleware::from_fn(check_auth_header))
        .routes(routes!(graphql_handler))
        .routes(routes!(basic_auth_handler))
        .routes(routes!(basic_auth_handler_v2))
        .routes(routes!(send_notification_handler))
        .routes(routes!(app_version))
        .split_for_parts();

    // Idk why I need to insert Month manually into the open api spec, otherwise it wont show up for some reason
    api_spec
        .components
        .get_or_insert_default()
        .schemas
        .insert("Month".to_string(), Month::schema().into());
    api_spec.info.title = "budget-tool_backend".to_string();
    api_spec.info.description = None;
    api_spec.info.contact = None;
    api_spec.info.license = None;

    #[cfg(debug_assertions)]
    {
        let graphql_playground_route = OpenApiRouter::new().routes(routes!(graphql_playground));
        router = router.merge(graphql_playground_route);
    }
    // Reassign here to make sure the router the right type
    let router = router.with_state(graphql_schema);

    #[cfg(debug_assertions)]
    {
        info!("Generated Open API spec");
        generate_open_api_spec_from_open_api(api_spec, "open_api_spec.json")
            .expect("Failed to generate open API spec");
    }

    return attach_tracing_cors_middleware(router);
}

#[cfg(debug_assertions)]
/// Graphql playground
#[instrument(skip_all)]
#[utoipa::path(get, path = "/graphql")]
pub async fn graphql_playground() -> impl IntoResponse {
    use crate::routes::auth::generate_jwt;
    use async_graphql::http::{GraphQLPlaygroundConfig, playground_source};

    use axum::response::Html;

    let token = generate_jwt("dev-1234");
    let auth_header = format!("Bearer {}", token);
    Html(playground_source(
        GraphQLPlaygroundConfig::new("/graphql").with_header("authorization", &auth_header),
    ))
}

/// Handler for graphql requests
#[instrument(skip_all)]
#[utoipa::path(
    post,
    path = "/graphql",
    responses(
        (status = 200, description = "GraphQL response"),
    ),
    )]
async fn graphql_handler(
    jwt: MaybeJwt,
    State(schema): State<SchemaType>,
    req: GraphQLRequest,
) -> GraphQLResponse {
    let req = req.into_inner();
    let postgres = PostgresDB::new().await;
    schema.execute(req.data(jwt).data(postgres)).await.into()
}

/// Contents of the JWT token
#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct JwtClaim {
    /// Username
    pub username: String,
    pub exp: i64,
}

/// An optional JWT token
pub struct MaybeJwt(pub Option<JwtClaim>);

impl Deref for MaybeJwt {
    type Target = Option<JwtClaim>;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

// TODO: implement an access / refresh token system later
// struct RefreshToken {
//     user: String,
//     expire: DateTime<Utc>,
//     token_id: String,
// }

/// Validate the JWT token in the header.
/// Um I kinda forgot to implement this route. So this route will always return true
#[utoipa::path(
    get,
    path = "/auth/validate-token",
    responses(
        (status = 200, description = "The JWT token is still valid"),
        (status = 401, description = "Authenication token expired. Please reauthenicate", body = String),
        (status = 403, description = "Authenication failed", body = String),
        (status = 500, description = "Failed to get update spending item", body = String),
    ),
)]
async fn validate_token() -> &'static str {
    return "success";
}

/// Validate the JWT token in the header fr this time.
/// By checking the JWT token in the authorization header is still valid or not
#[utoipa::path(
    get,
    path = "/auth/validate-token/v2",
    responses(
        (status = 200, description = "The JWT token is still valid"),
        (status = 403, description = "JWT has expired", body = String),
    ),
)]
async fn validate_token_v2(header: HeaderMap) -> StatusCode {
    let auth_header = header.get("Authorization");
    match auth_header {
        Some(header) => {
            match decode_jwt(
                header
                    .to_str()
                    .expect("Failed to convert auth header JWT to string"),
            ) {
                Ok(_) => return StatusCode::OK,
                Err(_) => return StatusCode::FORBIDDEN,
            }
        }
        None => return StatusCode::FORBIDDEN,
    }
}

/// Gets the spending items in csv form. If converting budget information to CSV fails at any point, partial data will not be returned
#[instrument(skip_all)]
#[utoipa::path(
    get,
    path = "/export/{year}/{month}/csv",
    params(
        ("year" = String, description = "The year the spending item is in"),
        ("month" = Month, description = "The month the spending item is in"),
    ),
    responses(
        (status = 200, description = "Spending items in CSV format", body = String),
        (status = 401, description = "Authenication token expired. Please reauthenicate", body = String),
        (status = 403, description = "Authenication failed", body = String),
        (status = 500, description = "Failed to get update spending item", body = String),
    ),
)]
async fn export_csv_handler(Path((year, month)): Path<(Year, Month)>) -> Result<String, AppError> {
    let db = PostgresDB::new().await;
    let mut tx = db.transaction().await?;
    let transactions = db
        .get_transactions(&mut tx, year, month)
        .await
        .context("Failed to get transactions")?;

    let mut wtr = csv::Writer::from_writer(Vec::new());
    wtr.write_record(["Amount", "Date", "Description", "Notes"])
        .context("Failed to write header")?;

    for transaction in transactions {
        let record = [
            transaction.amount.to_string(),
            transaction.date.to_string(),
            transaction.description.unwrap_or_default(),
            transaction.notes.unwrap_or_default(),
        ];
        debug!("Writing record {:#?}", record);
        wtr.write_record(record).context("Failed to write row")?;
    }

    let total_spending = db
        .compute_total_spend(&mut tx, year, month)
        .await
        .context("Failed to compute total spend")?;
    let total_budget = db
        .compute_total_allocation(&mut tx, year, month)
        .await
        .context("Failed to compute total budget")?;

    wtr.write_record(["Total spending", &total_spending.to_string(), "", ""])
        .context("Failed to write total spending to CSV")?;
    wtr.write_record(["Total budget", &total_budget.to_string(), "", ""])
        .context("Failed to write total allocated budget to CSV")?;

    wtr.flush().context("Failed to write CSV to buffer")?;
    let csv = wtr.into_inner().context("Failed to get CSV data")?;
    let csv = String::from_utf8(csv).context("Failed to convert csv into string")?;
    debug!(csv);

    return Ok(csv);
}
