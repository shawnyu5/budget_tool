use anyhow::{Context as AnhowContext, Result};
use async_graphql::{Context, InputObject, Object};
use chrono::NaiveDate;
use mongodb::bson::doc;
use rayon::iter::IntoParallelRefMutIterator;
use rayon::prelude::*;
use tracing::{debug, error, info, instrument, warn};

use crate::{
    db::{
        users::{User, USER_TABLE_NAME},
        DB,
    },
    graphql::query::{MonthlyBudgetConfigResponse, MonthlyBudgetResponse},
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

#[derive(InputObject)]
pub struct UpdateSpendingItemByIdInput {
    pub year: i32,
    pub month: Month,
    /// The new spending item to update
    pub spending_item: SpendingItem,
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

    #[instrument(skip_all)]
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
        month_budget.update_calculations();
        info!("Updated budget: {:#?}", month_budget);
        db.update_monthly_budget(inputs.month, &month_budget)
            .await
            .context("Failed to save updated budget to DB")?;

        return Ok(MonthlyBudgetResponse::MonthlyBudget(month_budget));
    }

    #[instrument(skip_all)]
    /// Update a spending item by ID
    async fn update_spending_item_by_id(
        &self,
        ctx: &Context<'_>,
        inputs: UpdateSpendingItemByIdInput,
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

        info!("New spending item: {:#?}", inputs.spending_item);
        let db = DB::new(&inputs.year.to_string())
            .await
            .context("Failed to connect to database")?;

        let mut monthly_budget = db
            .get_month_budget(inputs.month)
            .await
            .context("Failed to get budget for month {month}")?;

        // TODO: look into doing this without cloning
        info!("Looking for ID: {id}", id = inputs.spending_item.id);
        let updated_monthly_spending: Vec<SpendingItem> = monthly_budget
            .spending
            .par_iter_mut()
            .map(|spending| {
                info!("Iteration ID: {}", spending.id);
                if spending.id == inputs.spending_item.id {
                    info!("Found existing item, updating");
                    SpendingItem {
                        id: inputs.spending_item.id.clone(),
                        date: inputs.spending_item.date.clone(),
                        amount: inputs.spending_item.amount,
                        description: inputs.spending_item.description.clone(),
                        notes: inputs.spending_item.notes.clone(),
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

        monthly_budget.update_calculations();
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
            "month": inputs.month.to_string()
        };

        let result = db
            .collection
            .replace_one(filter, &monthly_budget)
            // .with_options(options)
            .await
            .context("Failed to update monthly budget")?;

        info!("Modified {} document(s)", result.modified_count);
        debug_assert!(
            result.modified_count == 1,
            "Should always modify a single document"
        );
        return Ok(MonthlyBudgetResponse::MonthlyBudget(monthly_budget));
    }
}
