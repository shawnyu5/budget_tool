// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI
@_spi(Execution) @_spi(Unsafe) import ApolloAPI

extension Backend {
  struct AddSpendingItemByMonthMutation: GraphQLMutation {
    static let operationName: String = "AddSpendingItemByMonth"
    static let operationDocument: ApolloAPI.OperationDocument = .init(
      definition: .init(
        #"mutation AddSpendingItemByMonth($inputs: AddSpendingItemByMonthInput!) { addSpendingItemByMonth(inputs: $inputs) { __typename ... on MonthlyBudget { totalSpending overBudgetAmount carriedOverFrom spending { __typename id description amount date notes } } ... on GraphQLErrorObject { code message } } }"#
      ))

    public var inputs: AddSpendingItemByMonthInput

    public init(inputs: AddSpendingItemByMonthInput) {
      self.inputs = inputs
    }

    @_spi(Unsafe) public var __variables: Variables? { ["inputs": inputs] }

    struct Data: Backend.SelectionSet {
      let __data: DataDict
      init(_dataDict: DataDict) { __data = _dataDict }

      static var __parentType: any ApolloAPI.ParentType { Backend.Objects.MutationRoot }
      static var __selections: [ApolloAPI.Selection] { [
        .field("addSpendingItemByMonth", AddSpendingItemByMonth.self, arguments: ["inputs": .variable("inputs")]),
      ] }
      static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
        AddSpendingItemByMonthMutation.Data.self
      ] }

      /// Add a spending item to a month
      var addSpendingItemByMonth: AddSpendingItemByMonth { __data["addSpendingItemByMonth"] }

      /// AddSpendingItemByMonth
      ///
      /// Parent Type: `MonthlyBudgetResponse`
      struct AddSpendingItemByMonth: Backend.SelectionSet {
        let __data: DataDict
        init(_dataDict: DataDict) { __data = _dataDict }

        static var __parentType: any ApolloAPI.ParentType { Backend.Unions.MonthlyBudgetResponse }
        static var __selections: [ApolloAPI.Selection] { [
          .field("__typename", String.self),
          .inlineFragment(AsMonthlyBudget.self),
          .inlineFragment(AsGraphQLErrorObject.self),
        ] }
        static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
          AddSpendingItemByMonthMutation.Data.AddSpendingItemByMonth.self
        ] }

        var asMonthlyBudget: AsMonthlyBudget? { _asInlineFragment() }
        var asGraphQLErrorObject: AsGraphQLErrorObject? { _asInlineFragment() }

        /// AddSpendingItemByMonth.AsMonthlyBudget
        ///
        /// Parent Type: `MonthlyBudget`
        struct AsMonthlyBudget: Backend.InlineFragment {
          let __data: DataDict
          init(_dataDict: DataDict) { __data = _dataDict }

          typealias RootEntityType = AddSpendingItemByMonthMutation.Data.AddSpendingItemByMonth
          static var __parentType: any ApolloAPI.ParentType { Backend.Objects.MonthlyBudget }
          static var __selections: [ApolloAPI.Selection] { [
            .field("totalSpending", Double.self),
            .field("overBudgetAmount", Double.self),
            .field("carriedOverFrom", GraphQLEnum<Backend.Month>?.self),
            .field("spending", [Spending].self),
          ] }
          static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
            AddSpendingItemByMonthMutation.Data.AddSpendingItemByMonth.self,
            AddSpendingItemByMonthMutation.Data.AddSpendingItemByMonth.AsMonthlyBudget.self
          ] }

          /// Total spending for the month. Including any over budget amount
          var totalSpending: Double { __data["totalSpending"] }
          /// Amount over budget for the month. 0 means not over budget.
          var overBudgetAmount: Double { __data["overBudgetAmount"] }
          /// The month it was carried over from
          /// If the setting are not carried over from a previous month, this value will be empty
          var carriedOverFrom: GraphQLEnum<Backend.Month>? { __data["carriedOverFrom"] }
          /// List of spent items
          var spending: [Spending] { __data["spending"] }

          /// AddSpendingItemByMonth.AsMonthlyBudget.Spending
          ///
          /// Parent Type: `SpendingItem`
          struct Spending: Backend.SelectionSet {
            let __data: DataDict
            init(_dataDict: DataDict) { __data = _dataDict }

            static var __parentType: any ApolloAPI.ParentType { Backend.Objects.SpendingItem }
            static var __selections: [ApolloAPI.Selection] { [
              .field("__typename", String.self),
              .field("id", String.self),
              .field("description", String.self),
              .field("amount", Double.self),
              .field("date", String.self),
              .field("notes", String?.self),
            ] }
            static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
              AddSpendingItemByMonthMutation.Data.AddSpendingItemByMonth.AsMonthlyBudget.Spending.self
            ] }

            /// A unique identifier
            var id: String { __data["id"] }
            /// Description of the purchase
            var description: String { __data["description"] }
            /// The dollar amount
            var amount: Double { __data["amount"] }
            /// The date
            var date: String { __data["date"] }
            /// Additional notes
            var notes: String? { __data["notes"] }
          }
        }

        /// AddSpendingItemByMonth.AsGraphQLErrorObject
        ///
        /// Parent Type: `GraphQLErrorObject`
        struct AsGraphQLErrorObject: Backend.InlineFragment {
          let __data: DataDict
          init(_dataDict: DataDict) { __data = _dataDict }

          typealias RootEntityType = AddSpendingItemByMonthMutation.Data.AddSpendingItemByMonth
          static var __parentType: any ApolloAPI.ParentType { Backend.Objects.GraphQLErrorObject }
          static var __selections: [ApolloAPI.Selection] { [
            .field("code", GraphQLEnum<Backend.GraphQLErrorCode>.self),
            .field("message", String.self),
          ] }
          static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
            AddSpendingItemByMonthMutation.Data.AddSpendingItemByMonth.self,
            AddSpendingItemByMonthMutation.Data.AddSpendingItemByMonth.AsGraphQLErrorObject.self
          ] }

          var code: GraphQLEnum<Backend.GraphQLErrorCode> { __data["code"] }
          var message: String { __data["message"] }
        }
      }
    }
  }

}