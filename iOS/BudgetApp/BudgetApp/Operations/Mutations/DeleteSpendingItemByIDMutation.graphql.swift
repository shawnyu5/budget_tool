// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI
@_spi(Execution) @_spi(Unsafe) import ApolloAPI

extension Backend {
  struct DeleteSpendingItemByIDMutation: GraphQLMutation {
    static let operationName: String = "DeleteSpendingItemByID"
    static let operationDocument: ApolloAPI.OperationDocument = .init(
      definition: .init(
        #"mutation DeleteSpendingItemByID($inputs: DeleteSpendingItemByIdInput!) { deleteSpendingItemById(inputs: $inputs) { __typename ... on MonthlyBudget { month totalSpending overBudgetAmount carriedOverFrom budget { __typename totalAllocation maggiePercentageAllocation maggieContributionAmount shawnPercentageAllocation shawnContributionAmount } spending { __typename id description amount date notes } } ... on GraphQLErrorObject { code message } } }"#
      ))

    public var inputs: DeleteSpendingItemByIdInput

    public init(inputs: DeleteSpendingItemByIdInput) {
      self.inputs = inputs
    }

    @_spi(Unsafe) public var __variables: Variables? { ["inputs": inputs] }

    struct Data: Backend.SelectionSet {
      let __data: DataDict
      init(_dataDict: DataDict) { __data = _dataDict }

      static var __parentType: any ApolloAPI.ParentType { Backend.Objects.MutationRoot }
      static var __selections: [ApolloAPI.Selection] { [
        .field("deleteSpendingItemById", DeleteSpendingItemById.self, arguments: ["inputs": .variable("inputs")]),
      ] }
      static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
        DeleteSpendingItemByIDMutation.Data.self
      ] }

      /// Delete a spending item by ID. If the item doesnt exist, this handler will not do anything
      var deleteSpendingItemById: DeleteSpendingItemById { __data["deleteSpendingItemById"] }

      /// DeleteSpendingItemById
      ///
      /// Parent Type: `MonthlyBudgetResponse`
      struct DeleteSpendingItemById: Backend.SelectionSet {
        let __data: DataDict
        init(_dataDict: DataDict) { __data = _dataDict }

        static var __parentType: any ApolloAPI.ParentType { Backend.Unions.MonthlyBudgetResponse }
        static var __selections: [ApolloAPI.Selection] { [
          .field("__typename", String.self),
          .inlineFragment(AsMonthlyBudget.self),
          .inlineFragment(AsGraphQLErrorObject.self),
        ] }
        static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
          DeleteSpendingItemByIDMutation.Data.DeleteSpendingItemById.self
        ] }

        var asMonthlyBudget: AsMonthlyBudget? { _asInlineFragment() }
        var asGraphQLErrorObject: AsGraphQLErrorObject? { _asInlineFragment() }

        /// DeleteSpendingItemById.AsMonthlyBudget
        ///
        /// Parent Type: `MonthlyBudget`
        struct AsMonthlyBudget: Backend.InlineFragment {
          let __data: DataDict
          init(_dataDict: DataDict) { __data = _dataDict }

          typealias RootEntityType = DeleteSpendingItemByIDMutation.Data.DeleteSpendingItemById
          static var __parentType: any ApolloAPI.ParentType { Backend.Objects.MonthlyBudget }
          static var __selections: [ApolloAPI.Selection] { [
            .field("month", GraphQLEnum<Backend.Month>.self),
            .field("totalSpending", Double.self),
            .field("overBudgetAmount", Double.self),
            .field("carriedOverFrom", GraphQLEnum<Backend.Month>?.self),
            .field("budget", Budget.self),
            .field("spending", [Spending].self),
          ] }
          static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
            DeleteSpendingItemByIDMutation.Data.DeleteSpendingItemById.self,
            DeleteSpendingItemByIDMutation.Data.DeleteSpendingItemById.AsMonthlyBudget.self
          ] }

          /// The month
          var month: GraphQLEnum<Backend.Month> { __data["month"] }
          /// Total spending for the month. Including any over budget amount
          var totalSpending: Double { __data["totalSpending"] }
          /// Amount over budget for the month. 0 means not over budget.
          var overBudgetAmount: Double { __data["overBudgetAmount"] }
          /// The month it was carried over from
          /// If the setting are not carried over from a previous month, this value will be empty
          var carriedOverFrom: GraphQLEnum<Backend.Month>? { __data["carriedOverFrom"] }
          /// Budget details
          var budget: Budget { __data["budget"] }
          /// List of spent items
          var spending: [Spending] { __data["spending"] }

          /// DeleteSpendingItemById.AsMonthlyBudget.Budget
          ///
          /// Parent Type: `BudgetConfig`
          struct Budget: Backend.SelectionSet {
            let __data: DataDict
            init(_dataDict: DataDict) { __data = _dataDict }

            static var __parentType: any ApolloAPI.ParentType { Backend.Objects.BudgetConfig }
            static var __selections: [ApolloAPI.Selection] { [
              .field("__typename", String.self),
              .field("totalAllocation", Double.self),
              .field("maggiePercentageAllocation", Double.self),
              .field("maggieContributionAmount", Double.self),
              .field("shawnPercentageAllocation", Double.self),
              .field("shawnContributionAmount", Double.self),
            ] }
            static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
              DeleteSpendingItemByIDMutation.Data.DeleteSpendingItemById.AsMonthlyBudget.Budget.self
            ] }

            /// Total allocated budget
            var totalAllocation: Double { __data["totalAllocation"] }
            /// Maggie percentage allocation
            var maggiePercentageAllocation: Double { __data["maggiePercentageAllocation"] }
            /// Maggie contribution amount. The frontend is responsible for computing this value
            var maggieContributionAmount: Double { __data["maggieContributionAmount"] }
            /// Shawn percentage allocation
            var shawnPercentageAllocation: Double { __data["shawnPercentageAllocation"] }
            /// Shawn contribution amount. The frontend is responsible for computing this value
            var shawnContributionAmount: Double { __data["shawnContributionAmount"] }
          }

          /// DeleteSpendingItemById.AsMonthlyBudget.Spending
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
              DeleteSpendingItemByIDMutation.Data.DeleteSpendingItemById.AsMonthlyBudget.Spending.self
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

        /// DeleteSpendingItemById.AsGraphQLErrorObject
        ///
        /// Parent Type: `GraphQLErrorObject`
        struct AsGraphQLErrorObject: Backend.InlineFragment {
          let __data: DataDict
          init(_dataDict: DataDict) { __data = _dataDict }

          typealias RootEntityType = DeleteSpendingItemByIDMutation.Data.DeleteSpendingItemById
          static var __parentType: any ApolloAPI.ParentType { Backend.Objects.GraphQLErrorObject }
          static var __selections: [ApolloAPI.Selection] { [
            .field("code", GraphQLEnum<Backend.GraphQLErrorCode>.self),
            .field("message", String.self),
          ] }
          static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
            DeleteSpendingItemByIDMutation.Data.DeleteSpendingItemById.self,
            DeleteSpendingItemByIDMutation.Data.DeleteSpendingItemById.AsGraphQLErrorObject.self
          ] }

          var code: GraphQLEnum<Backend.GraphQLErrorCode> { __data["code"] }
          var message: String { __data["message"] }
        }
      }
    }
  }

}