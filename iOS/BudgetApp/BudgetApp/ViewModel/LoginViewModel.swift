import SwiftUI

/// Login errors
enum LoginError: Error {
    /// If access is denied
    case Unauthorized
    /// HTTP level error, such as server not available
    case HttpError(description: String)
    /// 500 internal server error
    case InternalServerError
    case Unknown(statusCode: Int, description: String)
}

@Observable
final class LoginviewModel {
    var config = AppConfig()
    var isLoading = false
    /// Login to app using basic auth
    func login(username: String, password: String) async -> Result<String, LoginError> {
        do {
            let url = URL(string: "\(config.apiUrl)/login/basic")!

            let basicAuth = "\(username):\(password)"
            var basicAuthEncoded = ""
            if let basicAuthUtf = basicAuth.data(using: .utf8) {
                basicAuthEncoded = basicAuthUtf.base64EncodedString()
            } else {
                print("failed to encode username / password to utf8")
            }
            print("Using base64 encoded string: \(basicAuthEncoded)")
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.addValue("Basic \(basicAuthEncoded)", forHTTPHeaderField: "Authorization")

            isLoading = true
            let (data, response) = try await URLSession.shared.data(for: request)
            isLoading = false
            if let httpResponse = response as? HTTPURLResponse {
                switch httpResponse.statusCode {
                case 200 ... 299:
                    let token = String(data: data, encoding: .utf8)!
                    print("Got JWT token: \(token)")
                    isLoading = false
                    return .success(token)

                case 403:
                    print("Got 403 unauthorized error")
                    return .failure(LoginError.Unauthorized)

                case 500:
                    let body = String(data: data, encoding: .utf8)
                    print("Got 500 error: \(body ?? "EMPTY BODY")")
                    return .failure(LoginError.InternalServerError)

                default:
                    print("Got unknown status code")
                    let body = String(data: data, encoding: .utf8)
                    return .failure(LoginError.Unknown(statusCode: httpResponse.statusCode, description: body ?? ""))
                }
            } else {
                return .failure(LoginError.Unknown(statusCode: -1, description: "No HTTP response body"))
            }

        } catch {
            print("Failed to login: \(error)")
            return .failure(LoginError.HttpError(description: error.localizedDescription))
        }
    }
}
