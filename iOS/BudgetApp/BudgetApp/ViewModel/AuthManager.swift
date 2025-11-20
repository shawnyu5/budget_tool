import KeychainAccess
import SwiftUI

@Observable
final class AuthManager {
    /// If the user is logged in
    /// The login page will be shown if this is false
    var isAuthenticated = false
    /// The JWT token
    var token: String?

    init() {
        loadToken()
    }

    func loadToken() {
        if let saved = getJWTToken() {
            token = saved
            isAuthenticated = true
        }
    }

    func saveToken(_ token: String) {
        setJWTToken(token)
        self.token = token
        isAuthenticated = true
    }

    func logout() {
        setJWTToken(nil)
        token = nil
        isAuthenticated = false
    }
}

let keychainService = "com.shawnyu.budget-app"

/// Set store a JWT token in iOS key chain
private func setJWTToken(_ token: String?) {
    let keychain = Keychain(service: keychainService)
    keychain["token"] = token
}

/// Get the JWT token stored in iOS key chain
func getJWTToken() -> String? {
    let keychain = Keychain(service: keychainService)
    return keychain["token"] ?? nil
}
