import KeychainAccess

let keychainService = "com.shawnyu.budget-app"

/// Set store a JWT token in iOS key chain
func setJWTToken(_ token: String) {
    let keychain = Keychain(service: keychainService)
    keychain["token"] = token
}

/// Get the JWT token stored in iOS key chain
func getJWTToken() -> String {
    let keychain = Keychain(service: keychainService)
    return keychain["token"] ?? ""
}
