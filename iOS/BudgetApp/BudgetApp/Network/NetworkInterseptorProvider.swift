import Apollo
import ApolloAPI
import Foundation

struct NetworkInterceptorProvider: InterceptorProvider {
    func httpInterceptors<Operation: GraphQLOperation>(for operation: Operation) -> [any HTTPInterceptor] {
        return [AuthorizationInterceptor(token: getJWTToken())] + DefaultInterceptorProvider.shared.httpInterceptors(for: operation)
    }
}
