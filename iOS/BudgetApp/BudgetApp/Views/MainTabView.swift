import SwiftUI

/// Main view of the app, including a TabView for navigation
struct MainTabView: View {
    @Environment(AuthManager.self) private var auth: AuthManager
    @State private var selectedYear: Int32 = .init(Calendar.current.component(.year, from: Date()))
    @State private var selectedMonth: Backend.Month = {
        let formatter = DateFormatter()
        formatter.dateFormat = "LLLL"
        let monthName = formatter.string(from: Date()).lowercased()
        let str = Backend.Month.from(string: monthName)
        return Backend.Month.from(string: monthName) ?? .january
    }()

    var body: some View {
        TabView {
            NavigationStack {
                BudgetPageView(year: selectedYear, month: selectedMonth)
                    .toolbar {
                        // Picker("Year", selection: $selectedYear) {
                        //     ForEach(["one", "two"], id: \.self) { item in
                        //         Text(item)
                        //     }
                        // }
                        Picker("Year", selection: $selectedYear) {
                            ForEach([selectedYear - 1, selectedYear, selectedYear + 1], id: \.self) { option in
                                Text(String(option))
                            }
                        }

                        Picker("Month", selection: $selectedMonth) {
                            ForEach(Backend.Month.allCases, id: \.self) { month in
                                Text(month.rawValue).tag(month)
                            }
                        }
                    }
            }
            .tabItem {
                Label("Budget", systemImage: "square.stack")
            }

            NavigationStack {
                SettingsPageView()
            }
            .tabItem {
                Label("Settings", systemImage: "gear")
            }
        }
    }
}
