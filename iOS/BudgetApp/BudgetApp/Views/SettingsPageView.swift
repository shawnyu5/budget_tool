import SwiftUI

@MainActor
struct SettingsPageView: View {
    @Environment(AuthManager.self) private var auth: AuthManager

    /// The current selected year to get the budget of
    var selectedYear: Int32 = .init(Calendar.current.component(.year, from: Date()))
    /// The current selected month to get the budget of
    var selectedMonth: Month = {
        let formatter = DateFormatter()
        formatter.dateFormat = "LLLL"
        let monthName = formatter.string(from: Date()).lowercased()
        let str = Backend.Month.from(string: monthName)
        return Month.from(string: monthName) ?? .january
    }()

    // @State private var totalAllocation = {
    //     return shawnContributionPercentage + maggieContributionAmount
    // }
    var totalAllocation: Double {
        shawnContributionAmount + maggieContributionAmount
    }

    @State private var shawnContributionPercentage = 50.0
    @State private var shawnContributionAmount = 50.0
    @State private var maggieContributionPercentage = 50.0
    @State private var maggieContributionAmount = 50.0
    /// Show confirmation message this task was completed successfully
    @State private var showConfirmation = false

    @State private var viewModel = SettingsPageViewModel()
    /// Task for fetching budget
    @State private var fetchTask: Task<Void, Never>? = nil

    var body: some View {
        VStack {
            List {
                Section(header: Label("Budget Allocation", systemImage: "creditcard")) {}
                Text("Total budget")
                    .font(.subheadline)

                if viewModel.isLoading {
                    ProgressView("Loading...")
                } else {
                    Text(String(totalAllocation))
                        .background(Color.gray.opacity(0.2))
                        .cornerRadius(5)
                }

                Section {
                    Text("Shawn contribution percentage")
                        .font(.subheadline)
                    if viewModel.isLoading {
                        ProgressView("Loading...")
                    } else {
                        HStack {
                            TextField(
                                "Percentage", value: $shawnContributionPercentage, format: .number
                            )
                            .keyboardType(.numberPad)
                            // .onChange(of: shawnContributionPercentage) {
                            //     print(shawnContributionPercentage)
                            //     self.maggieContributionPercentage = 100 - shawnContributionPercentage
                            //     self.shawnContributionAmount = calculatePercentageOf(
                            //         total: totalAllocation, percentage: shawnContributionPercentage
                            //     )
                            //     self.maggieContributionAmount = calculatePercentageOf(
                            //         total: totalAllocation, percentage: maggieContributionPercentage
                            //     )
                            // }
                            Text("%")
                        }
                    }

                    Text("Shawn contribution amount")
                        .font(.subheadline)
                    if viewModel.isLoading {
                        ProgressView("Loading...")
                    } else {
                        TextField("$", value: $shawnContributionAmount, format: .number)
                            .keyboardType(.numberPad)
                            .onChange(of: shawnContributionAmount) {
                                self.maggieContributionAmount =
                                    totalAllocation - shawnContributionAmount
                            }
                    }
                }

                Section {
                    Text("Maggie contribution percentage")
                        .font(.subheadline)
                    // .onChange(of: maggieContributionPercentage) {
                    //     self.shawnContributionPercentage = 100 - maggieContributionPercentage
                    //     self.maggieContributionAmount = calculatePercentageOf(
                    //         total: totalAllocation, percentage: maggieContributionPercentage
                    //     )
                    //     self.shawnContributionAmount = calculatePercentageOf(
                    //         total: totalAllocation, percentage: shawnContributionPercentage
                    //     )
                    // }
                    if viewModel.isLoading {
                        ProgressView("Loading...")
                    } else {
                        HStack {
                            TextField(
                                "Percentage", value: $maggieContributionPercentage, format: .number
                            )
                            .keyboardType(.numberPad)
                            .onChange(of: maggieContributionPercentage) {
                                self.shawnContributionPercentage =
                                    100 - maggieContributionPercentage
                            }
                            Text("%")
                        }
                    }

                    Text("Maggie contribution amount")
                        .font(.subheadline)
                    TextField("$", value: $maggieContributionAmount, format: .number)
                        .keyboardType(.numberPad)
                        .onChange(of: maggieContributionAmount) {
                            self.shawnContributionPercentage = 100 - maggieContributionPercentage
                        }
                }
                Button(
                    "Save",
                    action: {
                        Task {
                            print("Updating settings")
                            try await viewModel.updateSettings(
                                new: Backend.UpdateBudgetConfigInput(
                                    year: String(selectedYear),
                                    month: GraphQLEnum(Backend.Month.from(month: selectedMonth)),
                                    budgetConfig: Backend.BudgetConfigInput(
                                        totalAllocation: self.totalAllocation,
                                        shawnPercentageAllocation: self.shawnContributionPercentage,
                                        shawnContributionAmount: self.shawnContributionAmount,
                                        maggiePercentageAllocation: self
                                            .maggieContributionPercentage,
                                        maggieContributionAmount: self.maggieContributionAmount
                                    )
                                ))
                            print("Settings updated")
                            self.showConfirmation = true

                            DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                                withAnimation {
                                    self.showConfirmation = false
                                }
                            }
                        }
                    }
                )
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
        .overlay(
            Group {
                if showConfirmation {
                    Text("Saved!")
                        .padding()
                        .background(Color.black.opacity(0.8))
                        .foregroundColor(.white)
                        .cornerRadius(10)
                        .transition(.opacity)
                        .zIndex(1)
                }
            }, alignment: .top
        )
        .animation(.easeInOut, value: true)
    }

    private func loadSettings() async {
        // Cancel previous fetch if still running
        fetchTask?.cancel()
        fetchTask = Task { @MainActor in
            await viewModel.fetchSettings(
                year: selectedYear, month: Backend.Month.from(month: selectedMonth)
            )
            if viewModel.errorCode == Backend.GraphQLErrorCode.forbidden {
                auth.isAuthenticated = false
            }

            self.shawnContributionPercentage =
                viewModel.budgetConfig?.shawnPercentageAllocation ?? 0.0
            self.shawnContributionAmount = viewModel.budgetConfig?.shawnContributionAmount ?? 0.0

            self.maggieContributionAmount = viewModel.budgetConfig?.maggieContributionAmount ?? 0.0
            self.maggieContributionPercentage =
                viewModel.budgetConfig?.maggiePercentageAllocation ?? 0.0
        }
    }
}

/// Calculates `total` is the `percentage` of what number
/// returns the total value `number` is a `percentage` of
private func calculatePercentageOf(
    total: Double,
    percentage: Double
) -> Double {
    let result = total / (percentage / 100.0)
    return round(result)
}

#Preview {
    SettingsPageView()
        .environment(AuthManager())
}
