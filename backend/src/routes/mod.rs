use std::ops::Deref;

use anyhow::anyhow;
use anyhow::Context;
use async_graphql_axum::GraphQLRequest;
use async_graphql_axum::GraphQLResponse;
use axum::body;
use axum::extract::State;
use axum::http::HeaderMap;
use axum::http::StatusCode;
use axum::middleware;
use axum::response::IntoResponse;
use axum::{extract::Path, Json, Router};
use chrono::Local;
use chrono::NaiveDate;
use common_axum::app_error_v2::AppError;
use common_axum::axum::generate_open_api_spec_from_open_api;
use common_axum::axum::{__path_app_version, app_version, attach_tracing_cors_middleware};
use mongodb::bson::doc;
use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use simd_json::from_slice;
use tokio_cron_scheduler::JobScheduler;
use tracing::debug;
use tracing::error;
use tracing::info;
use tracing::instrument;
use tracing::warn;
use utoipa_axum::router::OpenApiRouter;
use utoipa_axum::routes;

use crate::cron::init_all_user_crons;
use crate::custom_middleware::check_auth_header;
use crate::db::DBError;
use crate::graphql::generate_graphql_schema;
use crate::graphql::SchemaType;
use crate::monthly_budget::MonthlyBudget;
use crate::monthly_budget::SpendingItem;
use crate::routes::auth::basic_auth_handler_v2;
use crate::routes::auth::decode_jwt;
use crate::routes::auth::{
    __path_basic_auth_handler, __path_basic_auth_handler_v2, basic_auth_handler,
};
use crate::routes::notification::{
    __path_save_notification_subscription_handler, save_notification_subscription_handler,
};
use crate::routes::notification::{__path_send_notification_handler, send_notification_handler};
use crate::utils::calculate_percentage;
use crate::{db::DB, month::Month};
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
        .routes(routes!(get_month_budget_handler, update_budget_handler))
        .routes(routes! {
            get_spending_item,
            update_spending_item
        })
        .routes(routes!(validate_token))
        .routes(routes!(validate_token_v2))
        .routes(routes!(export_csv_handler))
        .layer(middleware::from_fn(check_auth_header))
        .routes(routes!(graphql_handler))
        .routes(routes!(basic_auth_handler))
        .routes(routes!(basic_auth_handler_v2))
        .routes(routes!(send_notification_handler))
        .routes(routes!(save_notification_subscription_handler))
        .routes(routes!(app_version))
        .split_for_parts();

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

    info!("Generated Open API spec");
    generate_open_api_spec_from_open_api(api_spec, "open_api_spec.json")
        .expect("Failed to generate open API spec");

    return attach_tracing_cors_middleware(router);
}

#[cfg(debug_assertions)]
/// Graphql playground
#[instrument(skip_all)]
#[utoipa::path(get, path = "/graphql")]
pub async fn graphql_playground() -> impl IntoResponse {
    use crate::routes::auth::generate_jwt;
    use async_graphql::http::{playground_source, GraphQLPlaygroundConfig};

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
    schema.execute(req.data(jwt)).await.into()
}

/// Get the budget information for a specific month
#[instrument(skip_all)]
#[deprecated = "Use the graphql query instead"]
#[utoipa::path(
    get,
    path = "/budget/{year}/{month}",
    responses(
        (status = 200, description = "The requested month's budget. If the request month does not have any budget records, this route will iterate back till either no more months to check, a budget is encountered. The returned budget will have no spending, all the fields are correct, and matches the request", body = MonthlyBudget),
        (status = 401, description = "Authenication token expired. Please reauthenicate", body = String),
        (status = 403, description = "Authenication failed", body = String),
        (status = 404, description = "All months, the requested month and before does not contain any monthly budget", body = String),
        (status = 500, description = "Failed to get the requested month's budget", body = String),
    ),
    params(
        ("year" = String, description = "The year which to get the budget of"),
        ("month" = Month, description = "The month's budget to get. The first letter of the month's name is expected to the captalized. ie `January`")
    )
)]
async fn get_month_budget_handler(
    Path((year, month)): Path<(String, Month)>,
) -> Result<impl IntoResponse, AppError> {
    info!("Connecting to DB");
    let db = match DB::new(&year).await {
        Ok(db) => db,
        Err(e) => {
            error!("Error: {}", e);
            return Err(AppError(StatusCode::INTERNAL_SERVER_ERROR, anyhow!(e)));
        }
    };

    match db.get_month_budget(month).await {
        Ok(mut monthly_budget) => {
            monthly_budget.update_calculations();
            return Ok(Json(monthly_budget));
        }
        Err(e) => {
            error!("Error querying db: {:?}", e);
            return Err(AppError(
                StatusCode::NOT_FOUND,
                DBError::BudgetNotFound.into(),
            ));
        }
    }
}

/// Update the budget for a specific month in a specific year. This route will also ensure the `totalSpending`, and `overBudgetAmount` is up to date
#[instrument(skip_all)]
#[utoipa::path(
    post,
    request_body(
        content = MonthlyBudget, content_type = "application/json",
    ),
    path = "/budget/{year}/{month}",
    responses(
        (status = 200, description = "Successfully updated the month's budget"),
        (status = 401, description = "Authenication token expired. Please reauthenicate", body = String),
        (status = 403, description = "Authenication failed", body = String),
        (status = 500, description = "Failed to update the month's budget", body = String),
    ),
    params(
        ("year" = String, description = "The year which to update the budget of"),
        ("month" = Month, description = "The month's budget to update. The first letter of the month's name is expected to the captalized. ie `January`")
    )
)]
async fn update_budget_handler(
    Path((year, month)): Path<(String, Month)>,
    Json(mut body): Json<MonthlyBudget>,
) -> Result<impl IntoResponse, AppError> {
    let db = DB::new(&year)
        .await
        .context("Failed to connect to database")?;
    body.update_calculations();
    let result = db.update_monthly_budget(month, &body).await?;
    // let filter = doc! {
    //     "month": month.to_string()
    // };
    // let options = ReplaceOptions::builder().upsert(true).build();
    // let result = db
    //     .collection
    //     .replace_one(filter, body)
    //     .with_options(options)
    //     .await
    //     .context("Failed to update monthly budget")?;

    info!("Matched {} document(s)", result.matched_count);
    info!("Modified {} document(s)", result.modified_count);
    return Ok(());
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

/// Search for a spending item by time and ID
#[instrument(skip_all)]
#[utoipa::path(
    get,
    path = "/spending-item/{year}/{month}/{id}",
    responses(
        (status = 200, description = "The request spending item", body = MonthlyBudget),
        (status = 401, description = "Authenication token expired. Please reauthenicate", body = String),
        (status = 403, description = "Authenication failed", body = String),
        (status = 500, description = "Failed to get the requested spending item", body = String),
    ),
    params(
        ("year" = String, description = "The year the spending item is in"),
        ("month" = Month, description = "The month the spending item is in"),
        ("id" = String, description = "The ID of the spending item"),
    )
)]
async fn get_spending_item(
    Path((year, month, id)): Path<(String, Month, String)>,
) -> Result<Json<Option<SpendingItem>>, AppError> {
    let db = DB::<MonthlyBudget>::new(&year)
        .await
        .context("Failed to connect to database")?;

    let filter = doc! {
        "month": month.to_string(),
        "spending": {
            "$elemMatch": {
                "id": id.clone(),
            }
        }
    };

    info!("Looking up spending item");
    let found = db
        .collection
        .find_one(filter)
        .await
        .context("Failed to look for spending item")?;

    if let Some(monthly_budget) = found {
        let spending_items: Vec<&SpendingItem> = monthly_budget
            .spending
            .par_iter()
            .filter(|spending| spending.id == id)
            .collect();
        debug_assert!(
            spending_items.len() == 1,
            "More than 1 spending items found. This should never happen. We are searching by ID"
        );

        // TODO: this should not be needed
        let mut spending_item = spending_items[0].clone();
        if spending_item.id.is_empty() {
            warn!("Spending item ID is empty, adding ID");
            spending_item.id = Local::now().to_string()
        }

        return Ok(Json(Some(spending_items[0].clone())));
    }
    info!("Filter matched no spending records");
    return Ok(Json(None));
}

/// Update a single spending item by ID in a specific year and month. As well as updating the `totalSpending`
#[instrument(skip_all)]
#[utoipa::path(
    post,
    path = "/spending-item/{year}/{month}/{id}",
    request_body(
        content = MonthlyBudget, content_type = "application/json",
    ),
    params(
        ("year" = String, description = "The year the spending item is in"),
        ("month" = Month, description = "The month the spending item is in"),
        ("id" = String, description = "The ID of the spending item to update"),
    ),
    responses(
        (status = 200, description = "The request spending item was Successfully updated"),
        (status = 401, description = "Authenication token expired. Please reauthenicate", body = String),
        (status = 403, description = "Authenication failed", body = String),
        (status = 500, description = "Failed to get update spending item", body = String),
    ),
)]
async fn update_spending_item(
    Path((year, month, id)): Path<(String, Month, String)>,
    Json(spending_item): Json<SpendingItem>,
) -> Result<(), AppError> {
    let db = DB::new(&year)
        .await
        .context("Failed to connect to database")?;

    let mut monthly_budget = db
        .get_month_budget(month)
        .await
        .context("Failed to get budget for month {month}")?;

    // TODO: look into doing this without cloning
    info!("Looking for ID: {id}");
    let updated_monthly_spending: Vec<SpendingItem> = monthly_budget
        .spending
        .par_iter_mut()
        .map(|spending| {
            info!("Iteration ID: {}", spending.id);
            if spending.id == id {
                SpendingItem {
                    id: spending_item.id.clone(),
                    date: spending_item.date.clone(),
                    amount: spending_item.amount,
                    description: spending_item.description.clone(),
                    notes: spending_item.notes.clone(),
                }
            } else {
                spending.clone()
            }
        })
        .collect();
    monthly_budget.spending = updated_monthly_spending;
    monthly_budget.spending.sort_by(|a, b| {
        info!("Sorting spending item");
        // If we cant parse either dates into a proper date, just give up
        let fallback_date = NaiveDate::from_ymd_opt(1, 1, 1).unwrap();
        let a_date = NaiveDate::parse_from_str(&a.date, "%Y/%m/%d").unwrap_or_else(|e| {
            error!(
                "Failed to parse date: {e}. Using fallback date: {}",
                fallback_date.to_string()
            );
            fallback_date
        });

        let b_date = NaiveDate::parse_from_str(&b.date, "%Y/%m/%d").unwrap_or_else(|e| {
            error!(
                "Failed to parse date: {e}. Using fallback date: {}",
                fallback_date.to_string()
            );
            fallback_date
        });

        b_date.cmp(&a_date)
    });
    debug!("Sorted spending items: {:?}", monthly_budget.spending);

    monthly_budget.calculate_over_budget_amount();
    info!(
        "Calculated over budget amount: {}",
        monthly_budget.over_budget_amount
    );
    info!(
        "Calculated total spending: {}",
        monthly_budget.total_spending
    );
    debug!("Updated spending items: {:?}", monthly_budget.spending);
    debug!(
        "Calculated total spending: {}",
        monthly_budget.total_spending
    );

    let filter = doc! {
        "month": month.to_string()
    };

    let result = db
        .collection
        .replace_one(filter, monthly_budget)
        // .with_options(options)
        .await
        .context("Failed to update monthly budget")?;

    info!("Modified {} document(s)", result.modified_count);
    debug_assert!(
        result.modified_count == 1,
        "Should always modify a single document"
    );
    return Ok(());
}

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
async fn export_csv_handler(
    Path((year, month)): Path<(String, Month)>,
) -> Result<String, AppError> {
    let monthly_budget = get_month_budget_handler(Path((year, month)))
        .await?
        .into_response();
    let monthly_budget = body::to_bytes(monthly_budget.into_body(), usize::MAX)
        .await
        .context("Failed to get budget information")?;
    let monthly_budget = from_slice::<MonthlyBudget>(&mut monthly_budget.to_vec())
        .context("Failed to convert body to Json")?;
    debug!("Monthly budget: {:#?}", monthly_budget);

    let mut wtr = csv::Writer::from_writer(Vec::new());
    wtr.write_record(["Amount", "Date", "Description", "Notes"])
        .context("Failed to write header")?;

    for spending in monthly_budget.spending {
        // TODO: if a row fails to write, should we return partial data?
        let record = [
            spending.amount.to_string(),
            spending.date,
            spending.description,
            spending.notes.unwrap_or_default(),
        ];
        debug!("Writing record {:#?}", record);
        wtr.write_record(record).context("Failed to write row")?;
    }

    wtr.write_record([
        "Total spending",
        &monthly_budget.total_spending.to_string(),
        "",
        "",
    ])
    .context("Failed to write total spending to CSV")?;
    wtr.write_record([
        "Total budget",
        &monthly_budget.budget.total_allocation.to_string(),
        "",
        "",
    ])
    .context("Failed to write total allocated budget to CSV")?;
    wtr.write_record([
        "Shawn contribution",
        &calculate_percentage(
            monthly_budget.total_spending,
            monthly_budget.budget.shawn_percentage_allocation,
        )
        .to_string(),
        "",
        "",
    ])
    .context("Failed to write Shawn contribution to CSV")?;
    wtr.write_record([
        "Maggie contribution",
        &calculate_percentage(
            monthly_budget.total_spending,
            monthly_budget.budget.maggie_percentage_allocation,
        )
        .to_string(),
        "",
        "",
    ])
    .context("Failed to write Maggie contribution to CSV")?;

    wtr.flush().context("Failed to write CSV to buffer")?;
    let csv = wtr.into_inner().context("Failed to get CSV data")?;
    let csv = String::from_utf8(csv).context("Failed to convert csv into string")?;
    debug!(csv);

    return Ok(csv);
}
