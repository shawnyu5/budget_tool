use async_graphql::{InputObject, SimpleObject};
use chrono::{DateTime, NaiveDate, TimeZone, Utc};
use rayon::iter::{IntoParallelRefIterator, ParallelIterator};
use serde::{Deserialize, Serialize};
use tracing::{debug, info, warn};
use utoipa::ToSchema;

use crate::{month::Month, utils::calculate_percentage};

/// Budget details for single month
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, ToSchema, SimpleObject, InputObject)]
#[graphql(input_name = "MonthlyBudgetInput")]
#[serde(rename_all = "camelCase")]
pub struct MonthlyBudget {
    /// The month
    pub month: Month,
    /// Budget details
    pub budget: BudgetConfig,
    /// Total spending for the month. Including any over budget amount
    #[schema(required = true)]
    #[serde(default)]
    pub total_spending: f64,
    /// Amount over budget for the month. 0 means not over budget.
    #[schema(required = true)]
    #[serde(default)]
    pub over_budget_amount: f64,
    /// List of spent items
    pub spending: Vec<SpendingItem>,
    /// The month it was carried over from
    /// If the setting are not carried over from a previous month, this value will be empty
    pub carried_over_from: Option<Month>,
}

impl MonthlyBudget {
    /// Sort transactions by date
    pub fn sort_by_date(&mut self) {
        /// Parse a date. Support both rfc3339 format and y/m/d format
        /// If date is in neither format, returns None
        fn parse_date(s: &str) -> Option<DateTime<Utc>> {
            // Try parsing as rfc3339 format
            if let Ok(dt) = DateTime::parse_from_rfc3339(s) {
                return Some(dt.with_timezone(&Utc));
            }

            if let Ok(date) = NaiveDate::parse_from_str(s, "%Y/%m/%d") {
                return Some(Utc.from_utc_datetime(&date.and_hms_opt(0, 0, 0)?));
            }

            None
        }
        self.spending.sort_by(|a, b| {
            info!("Sorting spending item by date");
            // If we cant parse either dates into a proper date, just give up
            let fallback_date = Utc::now();
            let a_date = a.date_rfc3339.as_ref().unwrap_or(&a.date);
            info!("Parsing first date: {a_date}");
            let a_date = parse_date(a_date).unwrap_or(fallback_date);

            let b_date = b.date_rfc3339.as_ref().unwrap_or(&a.date);
            info!("Parsing second date: {b_date}");
            let b_date = parse_date(b_date).unwrap_or(fallback_date);
            info!("Parsed date a: {a_date}");
            info!("Parsed date b: {b_date}");

            b_date.cmp(&a_date)
        });
    }
    pub fn update_calculations(&mut self) {
        self.calculate_total_spending();
        self.calculate_total_budget_allocation();
        self.calculate_over_budget_amount();
        self.update_individual_contribution_amount();
        self.calculate_over_budget_amount();
    }

    /// Calculates the total spending for the month by adding up all the amounts in `self.spending`
    ///
    /// Updates `self.total_spending`
    fn calculate_total_spending(&mut self) {
        self.total_spending = self
            .spending
            .par_iter()
            .map(|spend| spend.amount)
            .sum::<f64>();

        self.total_spending = (self.total_spending * 100.0).round() / 100.0;
        debug!("Total spending: {}", self.total_spending);
    }

    /// Calculates the total allocated budget, by adding up `self.budget.maggie_contribution_amount` and `self.budget.shawn_contribution_amount`.
    ///
    /// Updates `self.budget.total_allocation`
    fn calculate_total_budget_allocation(&mut self) {
        self.budget.total_allocation =
            self.budget.maggie_contribution_amount + self.budget.shawn_contribution_amount;

        self.budget.total_allocation = (self.budget.total_allocation * 100.0).round() / 100.0;
    }

    /// Calculates the amount over budget
    ///
    /// Populates `self.over_budget_amount`
    pub fn calculate_over_budget_amount(&mut self) {
        if self.budget.total_allocation < self.total_spending {
            self.over_budget_amount = self.total_spending - self.budget.total_allocation;
        } else {
            self.over_budget_amount = 0.0;
        }
        debug!("Over budget amount: {}", self.over_budget_amount);
    }

    /// Fills in `self.budget.*_contribution_amount` only if they are 0. Otherwise leave them be
    pub fn update_individual_contribution_amount(&mut self) {
        if self.budget.shawn_contribution_amount == 0.0 {
            self.budget.shawn_contribution_amount = calculate_percentage(
                self.budget.total_allocation,
                self.budget.shawn_percentage_allocation,
            );
        }
        if self.budget.maggie_contribution_amount == 0.0 {
            self.budget.maggie_contribution_amount = calculate_percentage(
                self.budget.total_allocation,
                self.budget.maggie_percentage_allocation,
            );
        }

        debug!(
            "Shawn contribution amount: {}",
            self.budget.shawn_contribution_amount
        );
        debug!(
            "Maggie contribution amount: {}",
            self.budget.maggie_contribution_amount
        );
    }
}

#[derive(
    Default, Debug, Clone, PartialEq, Serialize, Deserialize, ToSchema, SimpleObject, InputObject,
)]
#[graphql(input_name = "BudgetConfigInput")]
#[serde(rename_all = "camelCase")]
pub struct BudgetConfig {
    /// Total allocated budget
    #[schema(required = true)]
    #[serde(alias = "total")]
    pub total_allocation: f64,

    /// Shawn percentage allocation
    #[schema(required = true)]
    #[serde(alias = "shawn_percentage_allocation")]
    pub shawn_percentage_allocation: f64,

    /// Shawn contribution amount. The frontend is responsible for computing this value
    #[schema(required = true)]
    #[serde(default)]
    pub shawn_contribution_amount: f64,

    /// Maggie percentage allocation
    #[serde(alias = "maggie_percentage_allocation")]
    pub maggie_percentage_allocation: f64,

    /// Maggie contribution amount. The frontend is responsible for computing this value
    #[schema(required = true)]
    #[serde(default)]
    pub maggie_contribution_amount: f64,
}

/// A single transaction
#[derive(
    Default, Debug, Clone, PartialEq, Serialize, Deserialize, ToSchema, SimpleObject, InputObject,
)]
#[graphql(input_name = "SpendingItemInput")]
#[serde(rename_all = "camelCase")]
pub struct SpendingItem {
    /// A unique identifier
    pub id: String,
    /// The dollar amount
    pub amount: f64,
    /// The date
    pub date: String,
    /// Date in RFC3339 format
    // This field may not always exist in DB. Use Default::default() when it does not exist
    pub date_rfc3339: Option<String>,
    /// Description of the purchase
    pub description: String,
    /// Additional notes
    pub notes: Option<String>,
}
