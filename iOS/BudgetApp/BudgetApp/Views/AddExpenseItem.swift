//
//  AddExpenseItem.swift
//  BudgetApp
//
//  Created by Shawn Yu on 2025-10-26.
//

import SwiftUI

// Represents a single expense item
struct ExpenseItem: Identifiable, Codable {
    var id = UUID()
    let amount: Double
    let date: Date
    let description: String
    let Notes: String

    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case amount
        case date
        case description
        case Notes
    }
}

@Observable
class Expenses {
    // TODO: use swift data here
    var userDefaultKey = "Items"

    init() {
        if let userDefaultItems = UserDefaults.standard.data(forKey: userDefaultKey) {
            if let decodedItems: [ExpenseItem] = try? JSONDecoder().decode([ExpenseItem].self, from: userDefaultItems) {
                items = decodedItems
                return
            }
        }
    }

    var items = [ExpenseItem]() {
        didSet {
            if let encoded = try? JSONEncoder().encode(items) {
                UserDefaults.standard.set(encoded, forKey: userDefaultKey)
            }
        }
    }
}

struct AddExpenseItem: View {
    @State private var expenses = Expenses()
    @State private var name = ""
    @State private var date = Date()
    @State private var amount = 0.0
    @State private var description = ""
    @State private var notes = ""
    @State private var showingAddExpense = false
    // When to dismiss this view
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationStack {
            Form {
                TextField("Name", text: $name)
                TextField("Description", text: $description)

                DatePicker("Date", selection: $date, displayedComponents: [.date])

                TextField("Amount", value: $amount, format: .currency(code: Locale.current.identifier))
                #if os(iOS)
                    .keyboardType(.decimalPad)
                #endif

                TextEditor(text: $description)
                    .frame(height: 200)
            }
            .navigationTitle("Add new expense")
            .toolbar {
                Button("Save") {
                    let item = ExpenseItem(amount: amount, date: date, description: description, Notes: notes)
                    expenses.items.append(item)
                    dismiss()
                }
            }
        }
    }

    func removeItems(at offsets: IndexSet) {
        expenses.items.remove(atOffsets: offsets)
    }
}

#Preview {
    AddExpenseItem()
}
