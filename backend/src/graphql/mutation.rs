use anyhow::{Context as AnhowContext, Result};
use async_graphql::{Context, InputObject, Object};
use tracing::{debug, info, instrument, warn};

use crate::{
    db::{
        users::{User, USER_TABLE_NAME},
        DB,
    },
    graphql::{
        error::GraphQLErrorObject,
        query::{MonthlyBudgetConfigResponse, MonthlyBudgetResponse},
    },
    month::Month,
    monthly_budget::{BudgetConfig, SpendingItem},
    routes::MaybeJwt,
};

/// Root of the Mutation
#[derive(Default, Clone, Debug)]
pub struct MutationRoot;

#[derive(InputObject)]
pub struct SubscriptionInput {
    pub endpoint: String,
    pub p256dh: String,
    pub auth: String,
    pub expiration_time: Option<usize>,
}

#[derive(InputObject)]
pub struct UpdateBudgetConfigInput {
    /// The year of the budget to update
    pub year: i32,
    /// The month of the budget to update
    pub month: Month,
    /// The new budget
    pub budget_config: BudgetConfig,
}

#[derive(InputObject)]
pub struct AddSpendingItemByMonthInput {
    pub year: String,
    pub month: Month,
    pub spending_item: SpendingItem,
}

#[derive(InputObject)]
pub struct DeleteSpendingItemByIdInput {
    pub year: i32,
    pub month: Month,
    /// The ID of the spending item to delete
    pub id: String,
}

#[Object]
impl MutationRoot {
    /// Save a notification subscription for a user
    /// The user is extracted from the JWT
    #[instrument(skip_all)]
    async fn save_subscription(
        &self,
        ctx: &Context<'_>,
        subscription: SubscriptionInput,
    ) -> Result<User> {
        let maybe_jwt = ctx
            .data::<MaybeJwt>()
            .expect("There should always be a JWT here!");
        if maybe_jwt.is_none() {
            panic!("JWT is invalid");
            // return MonthlyBudgetResponse::Error(GraphQLErrorObject {
            //     code: GraphQLErrorCode::Forbidden,
            //     message: "Missing or invalid JWT".to_string(),
            // });
        }
        let jwt = maybe_jwt.as_ref().unwrap();
        info!("Saving user subscription");

        // Tracks if we are updating an existing user in the DB
        let mut existing_user = true;

        let db = DB::new(USER_TABLE_NAME)
            .await
            .context("Failed to connect to DB")?;
        let mut user = db.get_user(&jwt.username).await.unwrap_or_else(|_| {
            warn!("User {} not found in DB. Creating new user", jwt.username);
            existing_user = false;
            User {
                username: jwt.username.clone(),
                ..Default::default()
            }
        });
        debug!("Found user: {:?}", user);

        user.notification_subscription.endpoint = subscription.endpoint;
        user.notification_subscription.keys.p256dh = subscription.p256dh;
        user.notification_subscription.keys.auth = subscription.auth;
        user.notification_subscription.expiration_time = subscription.expiration_time;

        let _result = db
            .save_user_info(&user)
            .await
            .context("Failed to update subscription info")?;

        Ok(user)
    }

    /// Update the budget configuration for a specific month
    async fn update_budget_config(
        &self,
        ctx: &Context<'_>,
        inputs: UpdateBudgetConfigInput,
    ) -> Result<MonthlyBudgetConfigResponse> {
        let maybe_jwt = ctx
            .data::<MaybeJwt>()
            .expect("There should always be a JWT here!");
        if maybe_jwt.is_none() {
            panic!("JWT is invalid");
            // return MonthlyBudgetResponse::Error(GraphQLErrorObject {
            //     code: GraphQLErrorCode::Forbidden,
            //     message: "Missing or invalid JWT".to_string(),
            // });
        }
        let jwt = maybe_jwt.as_ref().unwrap();

        // If validation fails, dont bother doing anything else
        // TODO: proper error handling for if validation fails
        // inputs.budget_config.validate();

        let db = DB::new(&inputs.year.to_string())
            .await
            .context("Failed to connect to database")?;

        let mut month_budget = db
            .get_month_budget(inputs.month)
            .await
            .context("Failed to get month budget")?;

        month_budget.budget = inputs.budget_config;
        // budget.update_calculations();
        db.update_monthly_budget(inputs.month, &month_budget)
            .await
            .context("Failed to update budget")?;

        return Ok(MonthlyBudgetConfigResponse::MonthlyBudgetConfig(
            month_budget.budget,
        ));
    }

    #[instrument(skip_all)]
    /// Add a spending item to a month
    async fn add_spending_item_by_month(
        &self,
        ctx: &Context<'_>,
        inputs: AddSpendingItemByMonthInput,
    ) -> Result<MonthlyBudgetResponse> {
        let maybe_jwt = ctx
            .data::<MaybeJwt>()
            .expect("There should always be a JWT here!");
        if maybe_jwt.is_none() {
            panic!("JWT is invalid");
            // return MonthlyBudgetResponse::Error(GraphQLErrorObject {
            //     code: GraphQLErrorCode::Forbidden,
            //     message: "Missing or invalid JWT".to_string(),
            // });
        }

        let db = DB::new(inputs.year.as_str())
            .await
            .context("Failed to connect to DB")?;

        let mut month_budget = db
            .get_month_budget(inputs.month)
            .await
            .context("Failed to get monthly budget")?;

        month_budget.spending.push(inputs.spending_item);
        month_budget.update_calculations();

        info!("Updated budget: {:#?}", month_budget);
        db.update_monthly_budget(inputs.month, &month_budget)
            .await
            .context("Failed to save updated budget to DB")?;

        return Ok(MonthlyBudgetResponse::MonthlyBudget(month_budget));
    }

    /// Delete a spending item by ID. If the item doesnt exist, this handler will not do anything
    async fn delete_spending_item_by_id(
        &self,
        ctx: &Context<'_>,
        inputs: DeleteSpendingItemByIdInput,
    ) -> Result<MonthlyBudgetResponse> {
        let maybe_jwt = ctx
            .data::<MaybeJwt>()
            .expect("There should always be a JWT here!");
        if maybe_jwt.is_none() {
            panic!("JWT is invalid");
            // return MonthlyBudgetResponse::Error(GraphQLErrorObject {
            //     code: GraphQLErrorCode::Forbidden,
            //     message: "Missing or invalid JWT".to_string(),
            // });
        }

        let db = DB::new(&inputs.year.to_string())
            .await
            .context("Failed to connect to DB")?;

        let mut month_budget = db
            .get_month_budget(inputs.month)
            .await
            .context("Failed to get month budget")?;

        month_budget.spending.retain(|item| item.id != inputs.id);
        info!("Updated budget: {:#?}", month_budget);
        db.update_monthly_budget(inputs.month, &month_budget)
            .await
            .context("Failed to save updated budget to DB")?;

        return Ok(MonthlyBudgetResponse::MonthlyBudget(month_budget));
    }
}
