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

@MainActor
struct BudgetPageView: View {
    // If the add expense view is being shown right now
    @State private var showingAddExpenseItem = false

    func loadData() async {
        do {
            let response = try await apolloClient.fetch(query: Backend.GetConfigQuery())
            print(response.data?.config)
        } catch {
            print("Error fetching stuff: \(error.localizedDescription)")
        }
    }

    var body: some View {
        NavigationStack {
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
                    ForEach(1 ..< 100) {
                        Text("\($0)")
                    }
                }
            }.task {
                await loadData()
            }
            .toolbar {
                Button("Add Expense item", systemImage: "plus") {
                    showingAddExpenseItem = true
                }
            }.sheet(isPresented: $showingAddExpenseItem) {
                AddExpenseItem()
            }
        }
    }
}

#Preview {
    BudgetPageView()
}
