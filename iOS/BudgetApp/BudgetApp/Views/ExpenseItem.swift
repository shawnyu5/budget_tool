import SwiftUI

/// Represents a single expense item
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
            if let decodedItems: [ExpenseItem] = try? JSONDecoder().decode(
                [ExpenseItem].self, from: userDefaultItems
            ) {
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
    private var id = UUID()
    @State private var description = ""
    @State private var amount = 0.0
    @State private var date: Date = .init()
    @State private var notes = ""
    // When to dismiss this view
    @Environment(\.dismiss) var dismiss

    /// Create an Expense item view to display an expense item
    /// - title: the title of the view
    /// - expenseItem: the expense item to display in the view
    /// - onSubmit: to be called when the view is saved
    init(
        title: String,
        expenseItem: Spending,
        onSubmit: @escaping onSubmitFunc
    ) {
        self.title = title
        // self.expenseItem = expenseItem

        // Initialize local editable state
        _description = State(initialValue: expenseItem.description)
        _amount = State(initialValue: expenseItem.amount)
        id = .init(uuidString: expenseItem.id) ?? UUID()

        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy/M/d" // matches "2025/4/1"
        formatter.locale = Locale(identifier: "en_US_POSIX") // recommended for fixed formats
        _date = State(initialValue: formatter.date(from: expenseItem.date) ?? Date())
        _notes = State(initialValue: expenseItem.notes ?? "")
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
                                id: self.id.uuidString, amount: self.amount,
                                // TODO: this date format is not correct...
                                date: self.date.ISO8601Format(),
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
