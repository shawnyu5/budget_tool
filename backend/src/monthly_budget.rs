use async_graphql::SimpleObject;
use rayon::iter::{IntoParallelRefIterator, ParallelIterator};
use serde::{Deserialize, Serialize};
use tracing::debug;
use utoipa::ToSchema;

use crate::{month::Month, utils::calculate_percentage};
/// Budget details for single month
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, ToSchema, SimpleObject)]
#[serde(rename_all = "camelCase")]
pub struct MonthlyBudget {
    /// The month
    pub month: Month,
    /// Budget details
    pub budget: Budget,
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

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize, ToSchema, SimpleObject)]
#[serde(rename_all = "camelCase")]
pub struct Budget {
    /// Total allocated budget
    #[serde(alias = "total")]
    pub total_allocation: f64,
    /// Shawn percentage allocation
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
#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize, ToSchema, SimpleObject)]
#[serde(rename_all = "camelCase")]
pub struct SpendingItem {
    /// A unique identifier
    pub id: String,
    /// The dollar amount
    pub amount: f64,
    /// The date
    pub date: String,
    /// Description of the purchase
    pub description: String,
    /// Additional notes
    pub notes: Option<String>,
}
