import Apollo
import ApolloAPI
import Foundation
import Logging
import OSLog

struct AuthorizationInterceptor: HTTPInterceptor {
    let token: String?
    func intercept(
        request: URLRequest,
        next: NextHTTPInterceptorFunction
    ) async throws -> HTTPResponse {
        var request = request
        if let token {
            print("Added JWT token in interceptor: \(token)")
            request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        // if let token = getJWTToken() {
        //     print("Added JWT token in interceptor: \(token)")
        //     request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        // }
        do {
            let response = try await next(request)
            print("Interceptor response: \(response.response.statusCode)")
            return response
        } catch {
            print("Caught interceptor error: \(error)")
            throw error
        }
        // return try await next(request)
    }
}
