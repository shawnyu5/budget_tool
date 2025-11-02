//
//  BudgetPageView.swift
//  BudgetApp
//
//  Created by Shawn Yu on 2025-10-26.
//

import Apollo
import Foundation
import SwiftUI

let apolloClient = ApolloClient(url: URL(string: "http://localhost:8000/graphql")!)

/// Home page to display Budget
@MainActor
struct BudgetPageView: View {
    @State private var viewModel = BudgetViewModel()
    // If the add expense view is being shown right now
    @State private var showingAddExpenseItem = false

    func pingEndpoint() async {
        guard let url = URL(string: "http://localhost:8000") else {
            print("Invalid URL")
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET" // simple GET request

        do {
            let (data, response) = try await URLSession.shared.data(for: request)

            if let httpResponse = response as? HTTPURLResponse {
                print("Status code: \(httpResponse.statusCode)")
                print("Headers: \(httpResponse.allHeaderFields)")
            }

            if let body = String(data: data, encoding: .utf8), !body.isEmpty {
                print("bBody: \(body)")
            } else {
                print("No body returned")
            }
        } catch {
            print("Request failed:", error)
        }
    }

    func loadData() async {
        await viewModel.fetchConfig()
        /* await viewModel.fetchBudget(year: 2025, month: .april) */
        /* if viewModel.errorMessage != nil { */
        /*     print("Error message: \(String(describing: viewModel.errorMessage))") */
        /* } */
        /* let response = try await apolloClient.fetch(query: Backend.GetConfigQuery()) */
        /* print(response.data?.config) */
    }

    var body: some View {
        NavigationStack {
            if viewModel.isLoading {
                ProgressView("Loading...")
            } else if let error = viewModel.errorMessage {
                // Display error
                Text(error)
                    .foregroundColor(.red)
                    .multilineTextAlignment(.center)
                    .padding()
            } else {
                List {
                    Section(header: Label("Budget", systemImage: "creditcard")) {
                        /* Text("") */

                        HStack {
                            Text("$10/200").font(.title)
                        }
                        /* .padding(.leading) */

                        /* Text("") */

                        HStack {
                            Text("Shawn").bold()
                            Text("(60%): $100")
                        }
                        .padding(.leading)

                        HStack {
                            Text("Maggie").bold()
                            Text("(40%): $80")
                        }
                        .padding(.leading)
                    }
                    .padding(.vertical, 4)

                    Section(header: Label("Expenses", systemImage: "list.bullet")) {
                        ForEach(viewModel.budgetItems?.asMonthlyBudget?.spending ?? [], id: \.id) {
                            item in
                            Text(item.description)
                        }
                        /* ForEach(1 ..< 100) { */
                        /*     Text("\($0)") */
                        /* } */
                    }
                }.task {
                    /* await pingEndpoint() */
                    await viewModel.fetchConfig()
                    await viewModel.fetchBudget(year: 2025, month: .april)
                }
                .toolbar {
                    Button("Add Expense item", systemImage: "plus") {
                        showingAddExpenseItem = true
                    }
                }
                .sheet(isPresented: $showingAddExpenseItem) {
                    AddExpenseItem()
                }
                /* .refreshable { */
                /*     await loadData() */
                /* } */
            }
        }
    }
}

#Preview {
    BudgetPageView()
}
