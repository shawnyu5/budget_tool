import SwiftUI

/// Main view of the app, including a TabView for navigation
struct MainTabView: View {
    @Environment(AuthManager.self) private var auth: AuthManager
    @State private var selectedYear: Int32 = .init(Calendar.current.component(.year, from: Date()))
    @State private var selectedMonth: Month = {
        let formatter = DateFormatter()
        formatter.dateFormat = "LLLL"
        let monthName = formatter.string(from: Date()).lowercased()
        return Month.from(string: monthName) ?? .january
    }()

    var body: some View {
        TabView {
            NavigationStack {
                BudgetPageView(year: $selectedYear, month: $selectedMonth)
                    .modifier(DatePickerToolBarModifier(year: $selectedYear, month: $selectedMonth))
            }
            .tabItem {
                Label("Budget", systemImage: "square.stack")
            }

            NavigationStack {
                SettingsPageView(year: selectedYear, month: selectedMonth)
                    .modifier(DatePickerToolBarModifier(year: $selectedYear, month: $selectedMonth))
            }
            .tabItem {
                Label("Settings", systemImage: "gear")
            }
        }
        // .toolbar {
        //     Picker("Year", selection: $selectedYear) {
        //         ForEach([selectedYear - 1, selectedYear, selectedYear + 1], id: \.self) { option in
        //             Text(String(option))
        //         }
        //     }
        //
        //     Picker("Month", selection: $selectedMonth) {
        //         ForEach(Backend.Month.allCases, id: \.self) { month in
        //             Text(month.rawValue).tag(month)
        //         }
        //     }
        // }
    }
}
