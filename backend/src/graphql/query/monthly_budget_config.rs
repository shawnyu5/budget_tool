use async_graphql::Context;
use tracing::{error, info};

use crate::{
    db::DB,
    graphql::{
        error::{GraphQLErrorCode, GraphQLErrorObject},
        mutation::update_monthly_budget_config::MonthlyBudgetConfigResponse,
    },
    month::Month,
};

pub async fn monthly_budget_config_handler(
    _ctx: &Context<'_>,
    year: u16,
    month: Month,
) -> MonthlyBudgetConfigResponse {
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
