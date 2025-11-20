import SwiftUI

/// Main view of the app, including a TabView for navigation
struct MainTabView: View {
    @Environment(AuthManager.self) private var auth: AuthManager

    var body: some View {
        TabView {
            BudgetPageView(auth: AuthManager())
                .tabItem {
                    Label("Budget", systemImage: "square.stack")
                }

            // TODO: add settings page
            BudgetPageView(auth: AuthManager())
                // SttingsView()
                .tabItem {
                    Label("Settings", systemImage: "gear")
                }
        }
    }
}
