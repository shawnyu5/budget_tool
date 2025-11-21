import Foundation
import HTTPTypes
import OpenAPIRuntime
import OpenAPIURLSession

public struct BackendClient {
    public init() {}
    public func getSmth() async throws -> String {
        let config = AppConfig()
        let client = Client(
            serverURL: URL(string: config.apiUrl)!,
            transport: URLSessionTransport(),
            middlewares: [
            ]
        )

        let response = try await client.appVersion()
        switch response {
        case .internalServerError:
            print("Got internal server error")
        case let .ok(ok_response):
            print("Got OK response: \(ok_response)")
            switch ok_response.body {
            case let .json(json):
                print("JSon body: \(json.version)")
            }
        case let .undocumented(statusCode, _):
            print("Got unknown response: \(statusCode)")
        }

        return ""
    }
}
