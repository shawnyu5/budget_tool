import Apollo
import Foundation
import SwiftUI

/// Data for the Budget view. Fetches the budget for a specific year / month
@Observable
final class BudgetViewModel {
    /// Budget items
    var budgetItems: Backend.GetMonthBudgetQuery.Data.MonthlyBudget?
    /// If the budget is loading
    var isLoading = false
    /// Error code
    var errorCode: Backend.GraphQLErrorCode?
    /// Error message
    var errorMessage: String?

    var config: Backend.GetConfigQuery.Data?

    func fetchConfig() async {
        do {
            let response = try await Network.shared.graphql.fetch(query: Backend.GetConfigQuery())
            config = response.data
            print("Config: \(config?.config)")
        } catch {
            print("API error: \(error)")
        }
    }

    func fetchBudget(year: Int32, month: Backend.Month) async {
        isLoading = true
        errorMessage = nil
        defer {
            isLoading = false
        }

        do {
            let response = try await Network.shared.graphql.fetch(
                query: Backend.GetMonthBudgetQuery(year: year, month: GraphQLEnum(month)))
            print("Raw response: \(response.asJSONDictionary())")

            guard let budgetResult = response.data?.monthlyBudget else {
                // TODO: should we be returning an error message here...?
                // Lets look at what the UI looks like and decide from there
                errorMessage = "No budget for month \(month)"
                return
            }

            if let budget = budgetResult.asMonthlyBudget {
                print("Got budget: \(budget)")
            } else if let error = budgetResult.asGraphQLErrorObject {
                errorCode = error.code.value
                errorMessage = error.message
                if let errorCode = errorCode, let errorMessage = errorMessage {
                    print("Got error code: \(errorCode): \(errorMessage)")
                }

                /* print("Got error: \(errorCode): \(errorMessage)") */
            }
        } catch {
            errorMessage = "API error: \(error)"
        }
    }
}
