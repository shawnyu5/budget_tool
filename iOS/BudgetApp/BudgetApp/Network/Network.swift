import Apollo
import Foundation

final class Network {
    static let shared = Network()
    private(set) lazy var graphql = ApolloClient.shared
    // private(set) lazy var graphql = ApolloClient(url: URL(string: "http://localhost:8000/graphql")!)
}
