import SwiftUI

typealias onSubmitFunc = (Spending) async -> Void

/// Display a single expense item
struct ExpenseItemView: View {
    /// Title of the view
    var title: String

    // /// The expense item this view is displaying
    // var expenseItem: Spending?

    /// Closure called when the view is submitted, with the updated Spending item passed to it
    let onSubmit: onSubmitFunc

    // Local editable state
    private var id = UUID().uuidString
    @State private var description = ""
    @State private var amount = 0.0
    @State private var date: Date = .init()
    @State private var notes = ""
    // When to dismiss this view
    @Environment(\.dismiss) var dismiss

    /// Create an Expense item view to display an existing expense item
    /// - title: the title of the view
    /// - expenseItem: the expense item to display in the view
    /// - onSubmit: to be called when the view is saved
    init(
        title: String,
        expenseItem: Spending,
        onSubmit: @escaping onSubmitFunc
    ) {
        self.title = title

        id = expenseItem.id
        description = expenseItem.description
        amount = expenseItem.amount
        date = expenseItem.date
        notes = expenseItem.notes ?? ""
        self.onSubmit = onSubmit
    }

    /// Create an empty Expense item view, used for inputting new expense items
    /// - title: the title of the view
    /// - onSubmit: to be called when the view is saved
    init(
        title: String,
        onSubmit: @escaping onSubmitFunc
    ) {
        self.title = title
        self.onSubmit = onSubmit
    }

    var body: some View {
        NavigationStack {
            Form {
                TextField("Description", text: $description)
                DatePicker("Date", selection: $date, displayedComponents: [.date])

                TextField(
                    "Amount", value: $amount, format: .currency(code: Locale.current.identifier)
                )
                #if os(iOS)
                .keyboardType(.decimalPad)
                #endif

                VStack {
                    Text("Notes")
                        .font(.headline)
                        .foregroundColor(.secondary)

                    TextEditor(text: $notes)
                        .frame(height: 200)
                }
            }
            .navigationTitle(title)
            .toolbar {
                Button("Save") {
                    Task {
                        await self.onSubmit(
                            Spending(
                                id: self.id, amount: self.amount,
                                date: self.date,
                                description: self.description
                            ))
                        dismiss()
                    }
                }
            }
        }
    }
}

#Preview {
    ExpenseItemView(title: "Preview") {
        _ in
    }
}
