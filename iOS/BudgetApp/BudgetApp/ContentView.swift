//
//  ContentView.swift
//  BudgetApp
//
//  Created by Shawn Yu on 2025-10-26.
//

import Logging
import SwiftUI

struct ContentView: View {
    @Environment(AuthManager.self) private var auth: AuthManager
    var body: some View {
        NavigationStack {
            if auth.isAuthenticated {
                MainTabView()
            } else {
                LoginView()
            }
        }
    }
}

#Preview {
    ContentView()
        .environment(AuthManager.shared)
}
