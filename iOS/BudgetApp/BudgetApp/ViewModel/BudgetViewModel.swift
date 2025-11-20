import Apollo
import Foundation
import Logging
import SwiftUI

/// Data for the Budget view. Fetches the budget for a specific year / month
@Observable
final class BudgetViewModel {
    /// The JWT token to be used to authenticate requests
    var token: String?
    init(token: String?) {
        self.token = token
    }

    /// Budget items
    var budgetItems: Backend.GetMonthBudgetQuery.Data.MonthlyBudget.AsMonthlyBudget?
    // var budgetItems: Backend.GetMonthBudgetQuery.Data.MonthlyBudget?
    /// If the budget is loading
    var isLoading = false
    /// Error code
    var errorCode: Backend.GraphQLErrorCode?
    /// Error message
    var errorMessage: String?
    /// If the data has been already loaded
    var hasLoaded = false

    var config: Backend.GetConfigQuery.Data?

    func fetchConfig() async {
        do {
            let response = try await ApolloClient.shared.fetch(query: Backend.GetConfigQuery())
            config = response.data
            print("Config: \(String(describing: config))")
        } catch {
            print("API error: \(error)")
        }
    }

    func fetchBudget(year: Int32, month: Backend.Month) async {
        if hasLoaded {
            return
        } else {
            print("Has not loaded. Making request")
        }

        isLoading = true
        errorMessage = nil
        hasLoaded = true
        defer {
            isLoading = false
        }

        print("Fetching budget for year \(year) month \(month)")
        do {
            let response = try await ApolloClient.shared.fetch(
                query: Backend.GetMonthBudgetQuery(year: year, month: GraphQLEnum(month)))
            print(response.data?.monthlyBudget.asMonthlyBudget?.spending)
            guard let budgetResult = response.data?.monthlyBudget else {
                // TODO: should we be returning an error message here...?
                // Lets look at what the UI looks like and decide from there
                errorMessage = "No budget for month \(month)"
                return
            }

            if let budget = budgetResult.asMonthlyBudget {
                print("Got budget: \(budget)")
                budgetItems = budget
            } else if let error = budgetResult.asGraphQLErrorObject {
                print("Caught graphql error")
                errorCode = error.code.value
                errorMessage = error.message
                if let errorCode = errorCode, let errorMessage = errorMessage {
                    print("Got error code: \(errorCode): \(errorMessage)")
                }

                /* print("Got error: \(errorCode): \(errorMessage)") */
            }
        } catch {
            print("[Fetch budget] Caught API error: \(error.localizedDescription)")
            errorMessage = "API error: \(error)"
        }
    }
}
