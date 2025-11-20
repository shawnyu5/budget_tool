//
//  BudgetView.swift
//  BudgetApp
//
//  Created by Shawn Yu on 2025-10-26.
//

import Apollo
import Foundation
import SwiftUI

/// Home page to display Budget
@MainActor
struct BudgetPageView: View {
    init(auth: AuthManager) {
        _viewModel = State(wrappedValue: BudgetViewModel(token: auth.token))
    }

    @Environment(AuthManager.self) private var auth: AuthManager
    @State private var viewModel: BudgetViewModel
    // /// If this is the first load
    // @State private var hasLoaded = false
    // If the add expense view is being shown right now
    @State private var showingAddExpenseItem = false

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
                        HStack {
                            Text("$10/200").font(.title)
                        }

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
                        ForEach(viewModel.budgetItems?.spending ?? [], id: \.id) {
                            item in
                            Text(item.description)
                        }
                    }
                }
                .toolbar {
                    Button("Add Expense item", systemImage: "plus") {
                        showingAddExpenseItem = true
                    }
                }
                .sheet(isPresented: $showingAddExpenseItem) {
                    AddExpenseItem()
                }
            }
        }
        .task {
            print("Fetching budget in view...")
            await viewModel.fetchBudget(year: 2025, month: .april)
            if viewModel.errorCode == Backend.GraphQLErrorCode.forbidden {
                auth.isAuthenticated = false
            }
        }
        .refreshable {
            await viewModel.fetchBudget(year: 2025, month: .april)
        }
    }
}

#Preview {
    BudgetPageView(auth: AuthManager()).environment(AuthManager())
}
