// @generated
// This file was automatically generated and should not be edited.

@_spi(Internal) import ApolloAPI

extension Backend {
  /// GraphQL error codes
  enum GraphQLErrorCode: String, EnumType {
    /// When the user does not have the authorization
    case forbidden = "FORBIDDEN"
    /// Something went wrong on the server side. Typically response 500
    case serverError = "SERVER_ERROR"
    /// Failed to fetch budget for some reason. Typically response 404
    case failedToFetchBudget = "FAILED_TO_FETCH_BUDGET"
  }

}