import SwiftUI

/// Displays the budget for the current month
struct BudgetView: View {
    var totalSpending: Double = 0
    var overBudgetAmount: Double = 0
    var budgetConfig: BudgetConfig?

    /// Amount of money Shawn is responsible for paying
    private var shawnPayAmount: Double {
        //         calculatePercentage(
        //   (props.monthlyBudget()?.totalSpending ?? 0) -
        //     (props.monthlyBudget()?.overBudgetAmount ?? 0),
        //   props.monthlyBudget()?.budget?.shawnPercentageAllocation ?? 0,
        // ) +
        //   (props.monthlyBudget()?.overBudgetAmount ?? 0) / 2,

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
            Text("/")
            Text(String(budgetConfig?.totalAllocation ?? 0))
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
