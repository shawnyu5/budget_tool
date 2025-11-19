import SwiftUI

/// Contains app configuration
@Observable
final class AppConfig {
    let apiUrl: String

    init() {
        apiUrl = Bundle.main.object(forInfoDictionaryKey: "API_URL") as! String
    }
}
