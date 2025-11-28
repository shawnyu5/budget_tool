struct Budget {
    var month: Month
    var config: BudgetConfig
    var totalSpending: Float64
    var overBudgetAmount: Float64
    var spending: [Spending]
    var carriedOverFrom: Month?
}

struct Spending: Identifiable {
    var id: String
    var amount: Float64
    var date: String
    var description: String
    var notes: String?
}

extension Spending {
    static func from(
        graphql from: [Backend.GetMonthBudgetQuery.Data.MonthlyBudget.AsMonthlyBudget.Spending]
    ) -> [Self] {
        let converted = from.map { backend in
            Self(
                id: backend.id,
                amount: backend.amount,
                date: backend.date,
                description: backend.description,
                notes: backend.notes
            )
        }
        return converted
    }
}

extension Budget {
    static func from(
        graphqlQuery from: Backend.GetMonthBudgetQuery.Data.MonthlyBudget.AsMonthlyBudget
    ) -> Self {
        return Self(
            month: Month.from(backendMonth: from.month.value ?? .january),
            config: BudgetConfig.from(from.budget),
            totalSpending: from.totalSpending,
            overBudgetAmount: from.overBudgetAmount,
            spending: Spending.from(graphql: from.spending)
        )
    }
}

enum Month: String {
    case january = "January"
    case february = "February"
    case march = "March"
    case april = "April"
    case may = "May"
    case june = "June"
    case july = "July"
    case august = "August"
    case september = "September"
    case october = "October"
    case november = "November"
    case december = "December"
}

extension Month {
    static let allCases: [Self] = [
        .january, .february, .march, .april, .may, .june,
        .july, .august, .september, .october, .november, .december,
    ]

    /// Convert `Backend.Month` to `Month`
    static func from(backendMonth: Backend.Month) -> Self {
        switch backendMonth {
        case .january: return .january
        case .february: return .february
        case .march: return .march
        case .april: return .april
        case .may: return .may
        case .june: return .june
        case .july: return .july
        case .august: return .august
        case .september: return .september
        case .october: return .october
        case .november: return .november
        case .december: return .december
        }
    }

    /// Convert a string to Backend.Month
    static func from(string: String) -> Month? {
        let lower = string.lowercased()
        switch lower {
        case "january": return .january
        case "february": return .february
        case "march": return .march
        case "april": return .april
        case "may": return .may
        case "june": return .june
        case "july": return .july
        case "august": return .august
        case "september": return .september
        case "october": return .october
        case "november": return .november
        case "december": return .december
        default: return nil // handle invalid input
        }
    }
}
