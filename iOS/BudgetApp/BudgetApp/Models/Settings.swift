struct BudgetConfig {
    var totalAllocation: Double
    var shawnPercentageAllocation: Double
    var shawnContributionAmount: Double
    var maggiePercentageAllocation: Double
    var maggieContributionAmount: Double
}

extension BudgetConfig {
    static func from(
        budgetConfigQuery from: Backend.GetMonthlyBudgetConfigQuery.Data.MonthlyBudgetConfig
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
