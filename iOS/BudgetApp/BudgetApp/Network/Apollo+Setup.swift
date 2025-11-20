import Apollo
import Foundation

extension ApolloClient {
    static let config = AppConfig()
    static let shared: ApolloClient = {
        print("Constructing shared apollo client")
        let cache = InMemoryNormalizedCache()
        let store = ApolloStore(cache: cache)
        let url = URL(string: "\(config.apiUrl)/graphql")!
        print("Using backend URL: \(url)")

        let apolloConfig = URLSessionConfiguration.default
        apolloConfig.timeoutIntervalForRequest = 60
        apolloConfig.timeoutIntervalForResource = 60

        let session = URLSession(configuration: apolloConfig)
        let networkTransport = RequestChainNetworkTransport(
            urlSession: session,
            interceptorProvider: NetworkInterceptorProvider(),
            store: store,
            endpointURL: url
        )
        return ApolloClient(networkTransport: networkTransport, store: store)
    }()
}
