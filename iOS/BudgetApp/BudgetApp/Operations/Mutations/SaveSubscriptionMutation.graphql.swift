// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI
@_spi(Execution) @_spi(Unsafe) import ApolloAPI

extension BudgetApp {
  struct SaveSubscriptionMutation: GraphQLMutation {
    static let operationName: String = "saveSubscription"
    static let operationDocument: ApolloAPI.OperationDocument = .init(
      definition: .init(
        #"mutation saveSubscription($subscription: SubscriptionInput!) { saveSubscription(subscription: $subscription) { __typename username notificationSubscription { __typename endpoint expirationTime keys { __typename p256Dh auth } } } }"#
      ))

    public var subscription: SubscriptionInput

    public init(subscription: SubscriptionInput) {
      self.subscription = subscription
    }

    @_spi(Unsafe) public var __variables: Variables? { ["subscription": subscription] }

    struct Data: BudgetApp.SelectionSet {
      let __data: DataDict
      init(_dataDict: DataDict) { __data = _dataDict }

      static var __parentType: any ApolloAPI.ParentType { BudgetApp.Objects.MutationRoot }
      static var __selections: [ApolloAPI.Selection] { [
        .field("saveSubscription", SaveSubscription.self, arguments: ["subscription": .variable("subscription")]),
      ] }
      static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
        SaveSubscriptionMutation.Data.self
      ] }

      /// Save a notification subscription for a user
      /// The user is extracted from the JWT
      var saveSubscription: SaveSubscription { __data["saveSubscription"] }

      /// SaveSubscription
      ///
      /// Parent Type: `User`
      struct SaveSubscription: BudgetApp.SelectionSet {
        let __data: DataDict
        init(_dataDict: DataDict) { __data = _dataDict }

        static var __parentType: any ApolloAPI.ParentType { BudgetApp.Objects.User }
        static var __selections: [ApolloAPI.Selection] { [
          .field("__typename", String.self),
          .field("username", String.self),
          .field("notificationSubscription", NotificationSubscription.self),
        ] }
        static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
          SaveSubscriptionMutation.Data.SaveSubscription.self
        ] }

        /// Username of the user
        var username: String { __data["username"] }
        /// Notification subscription
        var notificationSubscription: NotificationSubscription { __data["notificationSubscription"] }

        /// SaveSubscription.NotificationSubscription
        ///
        /// Parent Type: `NotificationSubscription`
        struct NotificationSubscription: BudgetApp.SelectionSet {
          let __data: DataDict
          init(_dataDict: DataDict) { __data = _dataDict }

          static var __parentType: any ApolloAPI.ParentType { BudgetApp.Objects.NotificationSubscription }
          static var __selections: [ApolloAPI.Selection] { [
            .field("__typename", String.self),
            .field("endpoint", String.self),
            .field("expirationTime", Int?.self),
            .field("keys", Keys.self),
          ] }
          static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
            SaveSubscriptionMutation.Data.SaveSubscription.NotificationSubscription.self
          ] }

          var endpoint: String { __data["endpoint"] }
          var expirationTime: Int? { __data["expirationTime"] }
          var keys: Keys { __data["keys"] }

          /// SaveSubscription.NotificationSubscription.Keys
          ///
          /// Parent Type: `NotificationKeys`
          struct Keys: BudgetApp.SelectionSet {
            let __data: DataDict
            init(_dataDict: DataDict) { __data = _dataDict }

            static var __parentType: any ApolloAPI.ParentType { BudgetApp.Objects.NotificationKeys }
            static var __selections: [ApolloAPI.Selection] { [
              .field("__typename", String.self),
              .field("p256Dh", String.self),
              .field("auth", String.self),
            ] }
            static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
              SaveSubscriptionMutation.Data.SaveSubscription.NotificationSubscription.Keys.self
            ] }

            var p256Dh: String { __data["p256Dh"] }
            var auth: String { __data["auth"] }
          }
        }
      }
    }
  }

}