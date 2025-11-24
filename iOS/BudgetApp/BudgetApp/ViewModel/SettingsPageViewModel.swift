import Apollo
import SwiftUI

@Observable
final class SettingsPageViewModel {
    /// Settings for the particular month
    var budgetConfig: Backend.GetMonthlyBudgetConfigQuery.Data.MonthlyBudgetConfig.AsBudgetConfig?
    var isLoading = false
    /// Error code
    var errorCode: Backend.GraphQLErrorCode?
    /// Error message
    var errorMessage: String?

    /// Fetch settings for a specific month
    func fetchSettings(year: Int32, month: Backend.Month) async {
        do {
            let response = try await Network.shared.graphql.fetch(query: Backend.GetMonthlyBudgetConfigQuery(year: year, month: GraphQLEnum(month)))

            if let budgetConfig = response.data?.monthlyBudgetConfig.asBudgetConfig {
                print("Got budget config: \(budgetConfig)")
                self.budgetConfig = budgetConfig
            } else if let errorCode = response.data?.monthlyBudgetConfig.asGraphQLErrorObject {
                self.errorCode = errorCode.code.value
                errorMessage = errorCode.message
            }
        } catch {
            print("Network error: \(error)")
        }
    }
}
