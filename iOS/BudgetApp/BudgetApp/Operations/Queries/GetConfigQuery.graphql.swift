// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI
@_spi(Execution) @_spi(Unsafe) import ApolloAPI

extension Backend {
  struct GetConfigQuery: GraphQLQuery {
    static let operationName: String = "getConfig"
    static let operationDocument: ApolloAPI.OperationDocument = .init(
      definition: .init(
        #"query getConfig { config { __typename encryptionPublicKey vapidPublicKey } }"#
      ))

    public init() {}

    struct Data: Backend.SelectionSet {
      let __data: DataDict
      init(_dataDict: DataDict) { __data = _dataDict }

      static var __parentType: any ApolloAPI.ParentType { Backend.Objects.QueryRoot }
      static var __selections: [ApolloAPI.Selection] { [
        .field("config", Config.self),
      ] }
      static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
        GetConfigQuery.Data.self
      ] }

      /// Configuration for the frontend to consume
      var config: Config { __data["config"] }

      /// Config
      ///
      /// Parent Type: `FrontendConfig`
      struct Config: Backend.SelectionSet {
        let __data: DataDict
        init(_dataDict: DataDict) { __data = _dataDict }

        static var __parentType: any ApolloAPI.ParentType { Backend.Objects.FrontendConfig }
        static var __selections: [ApolloAPI.Selection] { [
          .field("__typename", String.self),
          .field("encryptionPublicKey", String.self),
          .field("vapidPublicKey", String.self),
        ] }
        static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
          GetConfigQuery.Data.Config.self
        ] }

        /// Base 64 encoded public key used for encryption
        var encryptionPublicKey: String { __data["encryptionPublicKey"] }
        /// Non base 64 encoded VAPID public key used for sending notifications
        var vapidPublicKey: String { __data["vapidPublicKey"] }
      }
    }
  }

}