import SwiftUI

/// Main view of the app, including a TabView for navigation
struct MainTabView: View {
    @Environment(AuthManager.self) private var auth: AuthManager

    var body: some View {
        TabView {
            NavigationStack {
                BudgetPageView()
            }
            .tabItem {
                Label("Budget", systemImage: "square.stack")
            }

            NavigationStack {
                // TODO: add settings page
                BudgetPageView()
                // SttingsView()
            }
            .tabItem {
                Label("Settings", systemImage: "gear")
            }
        }
    }
}
