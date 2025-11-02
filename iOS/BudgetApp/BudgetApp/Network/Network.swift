import Apollo
import Foundation

final class Network {
    static let shared = Network()
    private(set) lazy var graphql = ApolloClient(url: URL(string: "http://localhost:8000/graphql")!)

    /* private(set) lazy var apollo = { */
    /*     ApolloClient(url: URL(string: "http://192.168.2.230:8000/graphql")!) */
    /* } */
}
