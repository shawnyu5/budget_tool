extension Backend.Month {
    static let allCases: [Backend.Month] = [
        .january, .february, .march, .april, .may, .june,
        .july, .august, .september, .october, .november, .december,
    ]

    /// Convert a string to Backend.Month
    static func from(string string: String) -> Backend.Month? {
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
