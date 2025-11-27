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

    /// By default display the budget for the current month
    init() {
        _viewModel = State(wrappedValue: BudgetViewModel())
    }

    init(year selectedYear: Int32, month selectedMonth: Backend.Month) {
        self.init()
        self.selectedYear = selectedYear
        self.selectedMonth = selectedMonth
    }

    /// The current selected year to get the budget of
    var selectedYear: Int32 = .init(Calendar.current.component(.year, from: Date()))
    /// The current selected month to get the budget of
    var selectedMonth: Backend.Month = {
        let formatter = DateFormatter()
        formatter.dateFormat = "LLLL"
        let monthName = formatter.string(from: Date()).lowercased()
        let str = Backend.Month.from(string: monthName)
        return Backend.Month.from(string: monthName) ?? .january
    }()

    @State private var viewModel: BudgetViewModel
    /// If the add expense view is being shown right now
    @State private var showingAddExpenseItem = false
    /// If we are displaying `selectedItem`'s details
    // @State private var showingItemDetails = false
    /// The selected item to display details of
    @State private var selectedItem: Spending?

    /// Task for fetching budget
    @State private var fetchTask: Task<Void, Never>? = nil

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
                                                    year: selectedYear,
                                                    month: GraphQLEnum(selectedMonth),
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
        // .onChange(of: selectedYear) {
        //     Task {
        //         await loadBudget()
        //     }
        // }
        // .onChange(of: selectedMonth) {
        //     Task {
        //         await loadBudget()
        //     }
        // }
        .sheet(isPresented: $showingAddExpenseItem) {
            ExpenseItemView(title: "Add Expense Item") { expenseItem in
                do {
                    try await Network.shared.graphql.perform(
                        mutation: Backend.AddSpendingItemByMonthMutation(
                            inputs: Backend.AddSpendingItemByMonthInput(
                                year: String(selectedYear), month: GraphQLEnum(selectedMonth),
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

    private func loadBudget() async {
        // Cancel previous fetch if still running
        fetchTask?.cancel()
        fetchTask = Task { @MainActor in
            await viewModel.fetchBudget(year: selectedYear, month: selectedMonth)
            if viewModel.errorCode == Backend.GraphQLErrorCode.forbidden {
                auth.isAuthenticated = false
            }
        }
    }
}

extension Backend.GetMonthBudgetQuery.Data.MonthlyBudget.AsMonthlyBudget.Spending: Identifiable {}

#Preview {
    BudgetPageView().environment(AuthManager())
}
