//
//  BudgetApp.swift
//  BudgetApp
//
//  Created by Shawn Yu on 2025-10-26.
//

import OSLog
import SwiftData
import SwiftUI

let logger = Logger()

@main
struct BudgetApp: App {
    @State var auth = AuthManager()

    init() {
        logger.info("App started")
    }

    // var sharedModelContainer: ModelContainer = {
    //     let schema = Schema([
    //         Item.self,
    //     ])
    //     let modelConfiguration = ModelConfiguration(schema: schema, isStoredInMemoryOnly: false)
    //
    //     do {
    //         return try ModelContainer(for: schema, configurations: [modelConfiguration])
    //     } catch {
    //         fatalError("Could not create ModelContainer: \(error)")
    //     }
    // }()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(auth)
        }
        // .modelContainer(sharedModelContainer)
    }
}

private func setupLogging() {
    // LoggingSystem.bootstrap { label in
    //     var handler = StreamLogHandler.standardOutput(label: label)
    //     handler.logLevel = .debug
    //     return handler
    // }
}
