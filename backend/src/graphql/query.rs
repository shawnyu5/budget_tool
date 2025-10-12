use async_graphql::{Context, ErrorExtensions, FieldResult, Object, Result, SimpleObject, Union};
use base64::prelude::*;
use tracing::{error, info, instrument};

use crate::{
    config::Config,
    db::DB,
    graphql::error::{GraphQLErrorCode, GraphQLErrorObject},
    month::Month,
    monthly_budget::{BudgetConfig, MonthlyBudget},
    routes::MaybeJwt,
};

/// Root of the graphql query
#[derive(Default, Clone, Debug)]
pub struct QueryRoot;

/// Frontend configuration
#[derive(Default, Clone, SimpleObject)]
pub struct FrontendConfig {
    /// Base 64 encoded public key used for encryption
    encryption_public_key: String,
    /// Non base 64 encoded VAPID public key used for sending notifications
    vapid_public_key: String,
}

#[derive(Union)]
pub enum MonthlyBudgetResponse {
    MonthlyBudget(MonthlyBudget),
    Error(GraphQLErrorObject),
}

#[derive(Union)]
pub enum MonthlyBudgetConfigResponse {
    MonthlyBudgetConfig(BudgetConfig),
    Error(GraphQLErrorObject),
}

#[Object]
/// Root of the query
impl QueryRoot {
    /// Configuration for the frontend to consume
    #[instrument(skip_all)]
    async fn config(&self) -> FrontendConfig {
        let backend_config = Config::load();

        FrontendConfig {
            encryption_public_key: BASE64_STANDARD.encode(backend_config.public_key),
            vapid_public_key: backend_config.vapid_public_key,
        }
    }

    /// Get the budget for a specific month in a year
    ///
    /// * `year`: the year
    /// * `month`: the month
    #[instrument(skip_all)]
    async fn monthly_budget(
        &self,
        ctx: &Context<'_>,
        year: u16,
        month: Month,
    ) -> MonthlyBudgetResponse {
        // error!("Returning error!");
        // return MonthlyBudgetResponse::Error(GraphQLErrorObject {
        //     code: GraphQLErrorCode::ServerError,
        //     message: "Ahhhh".to_string(),
        // });
        let jwt = ctx
            .data::<MaybeJwt>()
            .expect("Missing JWT in graphql context");

        if jwt.is_none() {
            return MonthlyBudgetResponse::Error(GraphQLErrorObject {
                code: GraphQLErrorCode::Forbidden,
                message: "Missing or invalid JWT".to_string(),
            });
        }

        info!("Connecting to DB");
        let db = DB::new(&year.to_string())
            .await
            .map_err(|e| e.extend_with(|_, e| e.set("reason", "AHHH")))
            .unwrap();

        match db.get_month_budget(month).await {
            Ok(mut monthly_budget) => {
                monthly_budget.update_calculations();
                MonthlyBudgetResponse::MonthlyBudget(monthly_budget)
            }
            Err(e) => {
                error!("Error querying db: {:?}", e);
                MonthlyBudgetResponse::Error(GraphQLErrorObject {
                    code: GraphQLErrorCode::ServerError,
                    message: e.to_string(),
                })
            }
        }
    }

    #[instrument(skip_all)]
    async fn monthly_budget_config(
        &self,
        ctx: &Context<'_>,
        year: u16,
        month: Month,
    ) -> MonthlyBudgetConfigResponse {
        let jwt = ctx
            .data::<MaybeJwt>()
            .expect("There should always be a graphql token here");

        if jwt.is_none() {
            error!("Invalid JWT, returning graphql error");
            return MonthlyBudgetConfigResponse::Error(GraphQLErrorObject {
                code: GraphQLErrorCode::Forbidden,
                message: "Invalid JWT".to_string(),
            });
        }

        info!("Connecting to DB");
        let db = DB::new(&year.to_string()).await.unwrap();

        match db.get_month_budget(month).await {
            Ok(mut monthly_budget) => {
                monthly_budget.update_calculations();
                MonthlyBudgetConfigResponse::MonthlyBudgetConfig(monthly_budget.budget)
            }
            Err(e) => {
                error!("Error querying db: {:?}", e);
                MonthlyBudgetConfigResponse::Error(GraphQLErrorObject {
                    code: GraphQLErrorCode::ServerError,
                    message: e.to_string(),
                })
            }
        }
    }
}
