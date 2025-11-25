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
    /// Convert `Backend.Month` to `Month`
    static func from(month: Backend.Month) -> Month {
        switch month {
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
