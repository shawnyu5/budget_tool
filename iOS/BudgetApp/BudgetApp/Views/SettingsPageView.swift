import SwiftUI

@MainActor
struct SettingsPageView: View {
    @Environment(AuthManager.self) private var auth: AuthManager

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

    @State private var shawnContributionPercentage = "50.0"
    @State private var shawnContributionAmount = "50.0"
    @State private var maggieContributionPercentage = "50.0"
    @State private var maggieContributionAmount = "50.0"

    @State private var viewModel = SettingsPageViewModel()
    /// Task for fetching budget
    @State private var fetchTask: Task<Void, Never>? = nil

    var body: some View {
        VStack {
            List {
                Section(header: Label("Budget Allocation", systemImage: "creditcard")) {}
                Text("Total budget")
                    .font(.subheadline)

                Text(String(viewModel.budgetConfig?.totalAllocation ?? 0.0))
                    .background(Color.gray.opacity(0.2))
                    .cornerRadius(5)

                Section {
                    Text("Shawn contribution percentage")
                        .font(.subheadline)
                    HStack {
                        TextField("Percentage", text: $shawnContributionPercentage)
                        Text("%")
                    }

                    Text("Shawn contribution amount")
                        .font(.subheadline)
                    TextField("$", text: $shawnContributionAmount)
                }

                Section {
                    Text("Maggie contribution percentage")
                        .font(.subheadline)
                    HStack {
                        TextField("Percentage", text: $shawnContributionPercentage)
                        Text("%")
                    }
                    Text("Maggie contribution amount")
                        .font(.subheadline)
                    TextField("$", text: $maggieContributionAmount)
                }
            }
        }
        .task {
            print("Fetching budget in view")
            await loadSettings()
        }
        .refreshable {
            print("Refreshing")
            await loadSettings()
        }
    }

    private func loadSettings() async {
        // Cancel previous fetch if still running
        fetchTask?.cancel()
        fetchTask = Task { @MainActor in
            await viewModel.fetchSettings(year: selectedYear, month: selectedMonth)
            if viewModel.errorCode == Backend.GraphQLErrorCode.forbidden {
                auth.isAuthenticated = false
            }

            self.shawnContributionPercentage = String(viewModel.budgetConfig?.shawnPercentageAllocation ?? 0.0)
            self.shawnContributionAmount = String(viewModel.budgetConfig?.shawnContributionAmount ?? 0.0)

            self.maggieContributionAmount = String(viewModel.budgetConfig?.maggieContributionAmount ?? 0.0)
            self.maggieContributionPercentage = String(viewModel.budgetConfig?.maggiePercentageAllocation ?? 0.0)
        }
    }
}

#Preview {
    SettingsPageView()
        .environment(AuthManager())
}
