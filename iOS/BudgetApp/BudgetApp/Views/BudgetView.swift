import SwiftUI

/// Displays the budget for the current month
struct BudgetView: View {
    var totalSpending: Double = 0
    var overBudgetAmount: Double = 0
    var budgetConfig: BudgetConfig?

    /// Amount of money remaining in the current budget period
    private var remainingBudget: Double {
        return (budgetConfig?.totalAllocation ?? 0) - totalSpending
    }

    /// The color of the totalSpending text
    private var totalSpendingColor: Color {
        print("Over budget amount: \(overBudgetAmount)")
        if overBudgetAmount == 0 {
            return .primary
        } else {
            return .red
        }
    }

    /// Amount of money Shawn is responsible for paying
    private var shawnPayAmount: Double {
        return calculatePercentageOf(
            total: totalSpending - overBudgetAmount,
            percentage: budgetConfig?.shawnPercentageAllocation ?? 0
        ) + overBudgetAmount / 2
    }

    /// Amount of money Maggie is responsible for paying
    private var maggiePayAmount: Double {
        return calculatePercentageOf(
            total: totalSpending - overBudgetAmount,
            percentage: budgetConfig?.maggiePercentageAllocation ?? 0
        ) + overBudgetAmount / 2
    }

    var body: some View {
        HStack {
            Text("$")
            Text(String(totalSpending))
                .foregroundColor(totalSpendingColor)
            Text("/")
            Text(String(budgetConfig?.totalAllocation ?? 0))
            Text(" - ")
            Text(String(remainingBudget))
        }
        .font(.title)

        HStack {
            Text("Shawn").bold()
            Text(
                String(
                    format: "(%.2f%%): %.2f", budgetConfig?.shawnPercentageAllocation ?? 0,
                    shawnPayAmount
                ))
        }
        .padding(.leading)

        HStack {
            Text("Maggie").bold()
            Text(
                String(
                    format: "(%.2f%%): %.2f", budgetConfig?.maggiePercentageAllocation ?? 0,
                    maggiePayAmount
                ))
        }
        .padding(.leading)
    }
}
