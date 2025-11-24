import SwiftUI

@MainActor
struct SettingsPageView: View {
    @Environment(AuthManager.self) private var auth: AuthManager
    @State var shawnContributionPercentage = "50.0"
    @State var shawnContributionAmount = "50.0"

    @State var maggieContributionPercentage = "50.0"
    @State var maggieContributionAmount = "50.0"

    var body: some View {
        VStack {
            List {
                Section(header: Label("Budget Allocation", systemImage: "creditcard")) {}
                Text("Total budget")
                    .font(.subheadline)

                Text("12334")
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
    }
}

#Preview {
    SettingsPageView()
        .environment(AuthManager())
}
