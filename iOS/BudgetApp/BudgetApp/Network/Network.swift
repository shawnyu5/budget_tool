import Apollo
import Foundation
import HTTPTypes
import OpenAPIRuntime
import OpenAPIURLSession

/// Shared class for handling all networking operations in the app
final class Network {
    static let shared = Network()
    let auth = AuthManager.shared

    private init() {}
    /// Shared singleton graphql client
    private(set) lazy var graphql = ApolloClient.shared
    /// Shared singleton http client
    private(set) lazy var http: Client = {
        let config = AppConfig()
        let client = Client(
            serverURL: URL(string: config.apiUrl)!,
            transport: URLSessionTransport(),
            middlewares: [
                AuthenticationMiddleware(bearerToken: auth.token),
            ]
        )
        return client
    }()
}

private struct AuthenticationMiddleware: ClientMiddleware {
    /// The token value.
    var bearerToken: String?

    func intercept(
        _ request: HTTPRequest,
        body: HTTPBody?,
        baseURL: URL,
        operationID: String,
        next: @Sendable (HTTPRequest, HTTPBody?, URL) async throws -> (HTTPTypes.HTTPResponse, HTTPBody?)
    ) async throws -> (HTTPTypes.HTTPResponse, HTTPBody?) {
        var request = request
        request.headerFields[.authorization] = "Bearer \(bearerToken)"
        return try await next(request, body, baseURL)
    }
}
