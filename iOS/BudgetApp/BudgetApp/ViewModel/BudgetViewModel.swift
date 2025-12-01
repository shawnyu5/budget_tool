import Apollo
import Foundation
import Logging
import SwiftUI

/// Data for the Budget view. Fetches the budget for a specific year / month
@Observable
final class BudgetViewModel {
    /// Budget items
    var budget: Budget?
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
            print("Config: \(String(describing: config))")
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

        print("Fetching budget for year \(year) month \(month)")
        do {
            let response = try await ApolloClient.shared.fetch(
                query: Backend.GetMonthBudgetQuery(year: year, month: GraphQLEnum(month))
            )

            print(response.data?.monthlyBudget.asMonthlyBudget?.spending)
            guard let budgetResult = response.data?.monthlyBudget else {
                // TODO: should we be returning an error message here...?
                // Lets look at what the UI looks like and decide from there
                errorMessage = "No budget for month \(month)"
                return
            }

            if let budget = budgetResult.asMonthlyBudget {
                print("Got budget: \(budget)")
                self.budget = Budget.from(graphqlQuery: budget)
                // self.budget?.config.shawnPercentageAllocation = roundTwoDecimals(float: self.budget?.config.shawnPercentageAllocation ?? 0)
            } else if let error = budgetResult.asGraphQLErrorObject {
                print("Caught graphql error")
                errorCode = error.code.value
                errorMessage = error.message
                if let errorCode = errorCode, let errorMessage = errorMessage {
                    print("Got error code: \(errorCode): \(errorMessage)")
                    self.errorCode = errorCode
                }

                /* print("Got error: \(errorCode): \(errorMessage)") */
            }
        } catch {
            print("[Fetch budget] Caught API error: \(error.localizedDescription)")
            errorMessage = "API error: \(error.localizedDescription)"
        }
    }

    /// Update a spending item by ID
    func updateSpendingItemById(year: Int32, month: Month, item: Spending) async {
        do {
            let result = try await Network.shared.graphql.perform(
                mutation: Backend.UpdateSpendingItemByIDMutation(
                    inputs: Backend.UpdateSpendingItemByIdInput(
                        year: year,
                        month: GraphQLEnum(Backend.Month.from(month: month)),
                        spendingItem: .init(
                            id: item.id,
                            amount: item.amount,
                            date: dateToStr(date: item.date),
                            description: item.description
                        )
                    )))
            if let budget = result.data?.updateSpendingItemById.asMonthlyBudget {
                self.budget = Budget.from(graphqlQuery: budget)
            } else if let error = result.data?.updateSpendingItemById.asGraphQLErrorObject {
                print("Caught graphql error")
                errorCode = error.code.value
                errorMessage = error.message
                if let errorCode = errorCode, let errorMessage = errorMessage {
                    print("Got error code: \(errorCode): \(errorMessage)")
                    self.errorCode = errorCode
                }
            }
        } catch {
            print(error)
            errorMessage = error.localizedDescription
        }
    }

    func addSpendingItemByMonth(year: String, month: Month, spendingItem: Spending) async {
        do {
            let result = try await Network.shared.graphql.perform(
                mutation: Backend.AddSpendingItemByMonthMutation(
                    inputs: Backend.AddSpendingItemByMonthInput(
                        year: String(year),
                        month: GraphQLEnum(Backend.Month.from(month: month)),
                        spendingItem: Backend.SpendingItemInput(
                            id: spendingItem.id,
                            amount: spendingItem.amount,
                            date: dateToStr(date: spendingItem.date),
                            description: spendingItem.description
                        )

                    )))

            if let budget = result.data?.addSpendingItemByMonth.asMonthlyBudget {
                print("Got budget after update spend item: ")
                dump(budget)
                self.budget = Budget.from(graphqlQuery: budget)
            } else if let error = result.data?.addSpendingItemByMonth.asGraphQLErrorObject {
                print("Caught graphql error")
                errorCode = error.code.value
                errorMessage = error.message
                if let errorCode = errorCode, let errorMessage = errorMessage {
                    print("Got error code: \(errorCode): \(errorMessage)")
                    self.errorCode = errorCode
                }
            }
        } catch {
            print(error)
            errorMessage = error.localizedDescription
        }
    }

    func deleteSpendingItemByID(year: Int32, month: Month, id: String) async {
        do {
            let result = try await Network.shared.graphql.perform(
                mutation: Backend.DeleteSpendingItemByIDMutation(
                    inputs: Backend.DeleteSpendingItemByIdInput(
                        year: year,
                        month: GraphQLEnum(
                            Backend.Month.from(month: month)),
                        id: id
                    )))

            if let budget = result.data?.deleteSpendingItemById.asMonthlyBudget {
                print("Got budget after update spend item: ")
                dump(budget)
                self.budget = Budget.from(graphqlQuery: budget)
            } else if let error = result.data?.deleteSpendingItemById.asGraphQLErrorObject {
                print("Caught graphql error")
                errorCode = error.code.value
                errorMessage = error.message
                if let errorCode = errorCode, let errorMessage = errorMessage {
                    print("Got error code: \(errorCode): \(errorMessage)")
                    self.errorCode = errorCode
                }
            }
        } catch {
            print(error)
            errorMessage = error.localizedDescription
        }
    }
}
