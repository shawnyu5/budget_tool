//
//  BudgetPageView.swift
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
    @Environment(AuthManager.self) private var auth: AuthManager

    init() {
        _viewModel = State(wrappedValue: BudgetViewModel())
    }

    @State private var viewModel: BudgetViewModel
    /// If the add expense view is being shown right now
    @State private var showingAddExpenseItem = false
    /// If we are displaying `selectedItem`'s details
    @State private var showingItemDetails = false
    /// The selected item to display details of
    @State private var selectedItem: Backend.GetMonthBudgetQuery.Data.MonthlyBudget.AsMonthlyBudget.Spending?

    /// Task for fetching budget
    @State private var fetchTask: Task<Void, Never>? = nil

    var body: some View {
        NavigationStack {
            if let error = viewModel.errorMessage {
                // Display error
                Text(error)
                    .foregroundColor(.red)
                    .multilineTextAlignment(.center)
                    .padding()
            } else {
                List {
                    Section(header: Label("Budget", systemImage: "creditcard")) {
                        if viewModel.isLoading {
                            ProgressView("Loading...")
                        } else {
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
                    }
                    .padding(.vertical, 4)

                    Section(header: Label("Expenses", systemImage: "list.bullet")) {
                        ForEach(viewModel.budgetItems?.spending ?? [], id: \.id) {
                            item in
                            Button(action: {
                                selectedItem = item
                                showingItemDetails = true

                            }) {
                                Text(item.description)
                                    .onTapGesture {
                                        selectedItem = item
                                        showingItemDetails = true
                                    }
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                .toolbar {
                    Button("Add Expense item", systemImage: "plus") {
                        showingAddExpenseItem = true
                    }
                    .buttonStyle(.glass)
                    .buttonBorderShape(.automatic)
                }
                .sheet(isPresented: $showingAddExpenseItem) {
                    ExpenseItemView(title: "Add Expense Item", expenseItem: nil) { _ in }
                }
                .sheet(isPresented: $showingItemDetails) {
                    ExpenseItemView(title: "Edit expense item", expenseItem: nil) { _ in }
                }
            }
        }
        .task {
            print("Fetching budget in view...")
            await loadBudget()
        }
        .refreshable {
            print("Refreshing")
            await loadBudget()
        }
    }

    private func loadBudget() async {
        // Cancel previous fetch if still running
        fetchTask?.cancel()
        fetchTask = Task {
            await viewModel.fetchBudget(year: 2025, month: .april)

            if viewModel.errorCode == Backend.GraphQLErrorCode.forbidden {
                auth.isAuthenticated = false
            }
            // // Handle real errors
            // print("Budget fetch error: \(error)")
        }
    }
}

#Preview {
    BudgetPageView().environment(AuthManager.shared)
}
