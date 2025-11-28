struct BudgetConfig {
    var totalAllocation: Double
    var shawnPercentageAllocation: Double
    var shawnContributionAmount: Double
    var maggiePercentageAllocation: Double
    var maggieContributionAmount: Double
}

extension BudgetConfig {
    static func from(_ from: Backend.GetMonthBudgetQuery.Data.MonthlyBudget.AsMonthlyBudget.Budget) -> Self {
        Self(
            totalAllocation: from.totalAllocation,
            shawnPercentageAllocation: from.shawnPercentageAllocation,
            shawnContributionAmount: from.shawnContributionAmount,
            maggiePercentageAllocation: from.maggiePercentageAllocation,
            maggieContributionAmount: from.maggieContributionAmount
        )
    }

    static func from(_ from: Backend.DeleteSpendingItemByIDMutation.Data.DeleteSpendingItemById.AsMonthlyBudget.Budget) -> Self {
        Self(
            totalAllocation: from.totalAllocation,
            shawnPercentageAllocation: from.shawnPercentageAllocation,
            shawnContributionAmount: from.shawnContributionAmount,
            maggiePercentageAllocation: from.maggiePercentageAllocation,
            maggieContributionAmount: from.maggieContributionAmount
        )
    }

    static func from(_ from: Backend.AddSpendingItemByMonthMutation.Data.AddSpendingItemByMonth.AsMonthlyBudget.Budget) -> Self {
        Self(
            totalAllocation: from.totalAllocation,
            shawnPercentageAllocation: from.shawnPercentageAllocation,
            shawnContributionAmount: from.shawnContributionAmount,
            maggiePercentageAllocation: from.maggiePercentageAllocation,
            maggieContributionAmount: from.maggieContributionAmount
        )
    }

    static func from(_ from: Backend.UpdateSpendingItemByIDMutation.Data.UpdateSpendingItemById.AsMonthlyBudget.Budget) -> Self {
        Self(
            totalAllocation: from.totalAllocation,
            shawnPercentageAllocation: from.shawnPercentageAllocation,
            shawnContributionAmount: from.shawnContributionAmount,
            maggiePercentageAllocation: from.maggiePercentageAllocation,
            maggieContributionAmount: from.maggieContributionAmount
        )
    }

    static func from(
        _ from: Backend.GetMonthlyBudgetConfigQuery.Data.MonthlyBudgetConfig
            .AsBudgetConfig
    ) -> Self {
        return Self(
            totalAllocation: from.totalAllocation,
            shawnPercentageAllocation: from.shawnPercentageAllocation,
            shawnContributionAmount: from.shawnContributionAmount,
            maggiePercentageAllocation: from.maggiePercentageAllocation,
            maggieContributionAmount: from.maggieContributionAmount
        )
    }

    static func from(
        budgetConfigMutation from: Backend.UpdateMonthlyBudgetConfigMutation.Data.UpdateBudgetConfig
            .AsBudgetConfig
    ) -> Self {
        return Self(
            totalAllocation: from.totalAllocation,
            shawnPercentageAllocation: from.shawnPercentageAllocation,
            shawnContributionAmount: from.shawnContributionAmount,
            maggiePercentageAllocation: from.maggiePercentageAllocation,
            maggieContributionAmount: from.maggieContributionAmount
        )
    }
}
