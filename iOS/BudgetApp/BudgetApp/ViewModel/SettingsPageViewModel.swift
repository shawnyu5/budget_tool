import Apollo
import SwiftUI

@Observable
final class SettingsPageViewModel {
    /// Settings for the particular month
    var budgetConfig: BudgetConfig?
    var isLoading = false
    /// Error code
    var errorCode: Backend.GraphQLErrorCode?
    /// Error message
    var errorMessage: String?

    /// Fetch settings for a specific month
    func fetchSettings(year: Int32, month: Backend.Month) async {
        isLoading = true
        defer {
            self.isLoading = false
        }
        do {
            let response = try await Network.shared.graphql.fetch(query: Backend.GetMonthlyBudgetConfigQuery(year: year, month: GraphQLEnum(month)))

            if let budgetConfig = response.data?.monthlyBudgetConfig.asBudgetConfig {
                print("Got budget config: \(budgetConfig)")
                self.budgetConfig = BudgetConfig.from(budgetConfig)
            } else if let errorCode = response.data?.monthlyBudgetConfig.asGraphQLErrorObject {
                self.errorCode = errorCode.code.value
                errorMessage = errorCode.message
            }
        } catch {
            print("Network error: \(error)")
        }
    }

    func updateSettings(new settings: Backend.UpdateBudgetConfigInput) async throws {
        let response = try await Network.shared.graphql.perform(mutation: Backend.UpdateMonthlyBudgetConfigMutation(inputs: settings))
        if let error = response.data?.updateBudgetConfig.asGraphQLErrorObject {
            errorMessage = error.message
            errorCode = error.code.value
        } else if let config = response.data?.updateBudgetConfig.asBudgetConfig {
            budgetConfig = BudgetConfig.from(budgetConfigMutation: config)
            errorCode = nil
            errorMessage = nil
        }
    }
}
