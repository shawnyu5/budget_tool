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
    /// The current selected year to get the budget of
    @Binding var year: Int32
    /// The current selected month to get the budget of
    @Binding var month: Month

    @State private var viewModel = BudgetViewModel()
    /// If the add expense view is being shown right now
    @State private var showingAddExpenseItem = false
    /// If we are displaying `selectedItem`'s details
    // @State private var showingItemDetails = false
    /// The selected item to display details of
    @State private var selectedItem: Spending?
    /// Task for fetching budget
    @State private var fetchTask: Task<Void, Never>? = nil

    /// By default display the budget for the current month
    // init() {
    //     _viewModel = State(wrappedValue: BudgetViewModel())
    // }

    var body: some View {
        VStack {
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
                            BudgetView(
                                totalSpending: viewModel.budget?.totalSpending ?? 0,
                                overBudgetAmount: viewModel.budget?.overBudgetAmount ?? 0,
                                budgetConfig: viewModel.budget?.config
                            )
                            // HStack {
                            //     Text("$")
                            //     Text(String(viewModel.budget?.totalSpending ?? 0))
                            //     Text("/")
                            //     Text(String(viewModel.budget?.totalAllocation ?? 0))
                            // }
                            // .font(.title)
                            //
                            // HStack {
                            //     Text("Shawn").bold()
                            //     Text("(60%): $100")
                            // }
                            // .padding(.leading)
                            //
                            // HStack {
                            //     Text("Maggie").bold()
                            //     Text("(40%): $80")
                            // }
                            // .padding(.leading)
                        }
                    }
                    .padding(.vertical, 4)

                    Section(header: Label("Expenses", systemImage: "list.bullet")) {
                        if let spending = viewModel.budget?.spending {
                            ForEach(spending, id: \.id) {
                                item in
                                Button(action: {
                                    selectedItem = item
                                    // showingItemDetails = true

                                }) {
                                    Text(item.description)
                                    // .onTapGesture {
                                    //     selectedItem = item
                                    //     showingItemDetails = true
                                    // }
                                }
                                .buttonStyle(.plain)
                            }
                            .onDelete(perform: { indexSet in
                                guard let budgetSpending = viewModel.budget?.spending else {
                                    return
                                }

                                for index in indexSet {
                                    let itemToDelete = budgetSpending[index]
                                    let idToDelete = itemToDelete.id
                                    Task {
                                        try await Network.shared.graphql.perform(
                                            mutation: Backend.DeleteSpendingItemByIDMutation(
                                                inputs: Backend.DeleteSpendingItemByIdInput(
                                                    year: year,
                                                    month: GraphQLEnum(
                                                        Backend.Month.from(month: month)),
                                                    id: idToDelete
                                                )))
                                    }
                                }
                            })
                        }
                    }
                }
                .toolbar {
                    ToolbarItemGroup(placement: .navigationBarTrailing) {
                        // Picker("Year", selection: $selectedYear) {
                        //     ForEach([selectedYear - 1, selectedYear, selectedYear + 1], id: \.self) { option in
                        //         Text(String(option))
                        //     }
                        // }
                        //
                        // Picker("Month", selection: $selectedMonth) {
                        //     ForEach(Backend.Month.allCases, id: \.self) { month in
                        //         Text(month.rawValue).tag(month)
                        //     }
                        // }
                        Button("Add Expense item", systemImage: "plus") {
                            showingAddExpenseItem = true
                        }
                        .buttonStyle(.glass)
                        .buttonBorderShape(.automatic)
                    }
                }
                // .toolbar {}
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
        .onChange(of: year) {
            Task {
                await loadBudget()
            }
        }
        .onChange(of: month) {
            Task {
                await loadBudget()
            }
        }
        .sheet(isPresented: $showingAddExpenseItem) {
            ExpenseItemView(title: "Add Expense Item") { expenseItem in
                do {
                    try await Network.shared.graphql.perform(
                        mutation: Backend.AddSpendingItemByMonthMutation(
                            inputs: Backend.AddSpendingItemByMonthInput(
                                year: String(year),
                                month: GraphQLEnum(Backend.Month.from(month: month)),
                                spendingItem: Backend.SpendingItemInput(
                                    id: expenseItem.id,
                                    amount: expenseItem.amount,
                                    date: expenseItem.date, description: expenseItem.description
                                )

                            )))
                } catch {
                    print("Failed to add spending item: \(error)")
                    viewModel.errorMessage = error.localizedDescription
                }

                await loadBudget()
            }
            .onAppear {
                print("Showing add expense item sheet")
            }
        }
        .sheet(item: $selectedItem) { item in
            ExpenseItemView(title: "Edit expense item", expenseItem: item) { _ in }
                .onAppear {
                    print("SHEET: selected item: \(item)")
                }
        }
    }

    @MainActor
    private func loadBudget() async {
        // Cancel previous fetch if still running
        fetchTask?.cancel()
        fetchTask = Task { @MainActor in
            await viewModel.fetchBudget(year: year, month: Backend.Month.from(month: month))
            if viewModel.errorCode == Backend.GraphQLErrorCode.forbidden {
                auth.isAuthenticated = false
            }
        }
    }
}

extension Backend.GetMonthBudgetQuery.Data.MonthlyBudget.AsMonthlyBudget.Spending: Identifiable {}

#Preview {
    BudgetPageView(year: .constant(2025), month: .constant(.november))
        .environment(AuthManager())
}
