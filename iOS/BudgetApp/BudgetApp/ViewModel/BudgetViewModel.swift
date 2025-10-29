import Apollo
import Foundation
import SwiftUI

/// Data for the Budget view. Fetches the budget for a specific year / month
@Observable
final class BudgetViewModel {
    var budgetItems: [Backend.GetMonthBudgetQuery.Data.MonthlyBudget] = []
    var isLoading = false
    var errorMessage: String?

    func fetchBudget(year: Int32, month: Backend.Month) async {
        isLoading = true
        errorMessage = nil
        defer {
            isLoading = false
        }

        do {
            let response = try await Network.shared.apollo.fetch(query: Backend.GetMonthBudgetQuery(year: year, month: GraphQLEnum(month)))

            guard let budgetResult = response.data?.monthlyBudget else {
                // TODO: should we be returning an error message here...?
                // Lets look at what the UI looks like and decide from there
                errorMessage = "No budget for month \(month)"
                return
            }

            if let budget = budgetResult.asGraphQLErrorObject {
                print("Got budget: \(budget)")
            } else if let error = budgetResult.asGraphQLErrorObject {
                print("Got error... \(error.message)")
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
