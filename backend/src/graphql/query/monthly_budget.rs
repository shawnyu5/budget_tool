use async_graphql::Context;
use tracing::{error, info, instrument};

use crate::{
    db::DB,
    graphql::{
        error::{GraphQLErrorCode, GraphQLErrorObject},
        mutation::MonthlyBudgetResponse,
    },
    month::Month,
};

pub async fn monthly_budget_handler(
    _ctx: &Context<'_>,
    year: u16,
    month: Month,
) -> MonthlyBudgetResponse {
    info!("Connecting to DB");
    let db = match DB::new(&year.to_string()).await {
        Ok(db) => db,
        Err(err) => {
            error!("Failed to connect to DB: {err}");
            return MonthlyBudgetResponse::Error(GraphQLErrorObject {
                code: GraphQLErrorCode::ServerError,
                message: "Failed to connect to DB".to_string(),
            });
        }
    };

    info!("Connected to DB");
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
