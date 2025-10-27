// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI
@_spi(Execution) @_spi(Unsafe) import ApolloAPI

extension Backend {
  struct GetMonthBudgetQuery: GraphQLQuery {
    static let operationName: String = "GetMonthBudget"
    static let operationDocument: ApolloAPI.OperationDocument = .init(
      definition: .init(
        #"query GetMonthBudget($year: Int!, $month: Month!) { monthlyBudget(year: $year, month: $month) { __typename ... on MonthlyBudget { __typename month totalSpending overBudgetAmount spending { __typename id amount date description notes } carriedOverFrom budget { __typename totalAllocation maggiePercentageAllocation maggieContributionAmount shawnPercentageAllocation shawnContributionAmount } } ... on GraphQLErrorObject { __typename code message } } }"#
      ))

    public var year: Int32
    public var month: GraphQLEnum<Month>

    public init(
      year: Int32,
      month: GraphQLEnum<Month>
    ) {
      self.year = year
      self.month = month
    }

    @_spi(Unsafe) public var __variables: Variables? { [
      "year": year,
      "month": month
    ] }

    struct Data: Backend.SelectionSet {
      let __data: DataDict
      init(_dataDict: DataDict) { __data = _dataDict }

      static var __parentType: any ApolloAPI.ParentType { Backend.Objects.QueryRoot }
      static var __selections: [ApolloAPI.Selection] { [
        .field("monthlyBudget", MonthlyBudget.self, arguments: [
          "year": .variable("year"),
          "month": .variable("month")
        ]),
      ] }
      static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
        GetMonthBudgetQuery.Data.self
      ] }

      /// Get the budget for a specific month in a year
      ///
      /// * `year`: the year
      /// * `month`: the month
      var monthlyBudget: MonthlyBudget { __data["monthlyBudget"] }

      /// MonthlyBudget
      ///
      /// Parent Type: `MonthlyBudgetResponse`
      struct MonthlyBudget: Backend.SelectionSet {
        let __data: DataDict
        init(_dataDict: DataDict) { __data = _dataDict }

        static var __parentType: any ApolloAPI.ParentType { Backend.Unions.MonthlyBudgetResponse }
        static var __selections: [ApolloAPI.Selection] { [
          .field("__typename", String.self),
          .inlineFragment(AsMonthlyBudget.self),
          .inlineFragment(AsGraphQLErrorObject.self),
        ] }
        static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
          GetMonthBudgetQuery.Data.MonthlyBudget.self
        ] }

        var asMonthlyBudget: AsMonthlyBudget? { _asInlineFragment() }
        var asGraphQLErrorObject: AsGraphQLErrorObject? { _asInlineFragment() }

        /// MonthlyBudget.AsMonthlyBudget
        ///
        /// Parent Type: `MonthlyBudget`
        struct AsMonthlyBudget: Backend.InlineFragment {
          let __data: DataDict
          init(_dataDict: DataDict) { __data = _dataDict }

          typealias RootEntityType = GetMonthBudgetQuery.Data.MonthlyBudget
          static var __parentType: any ApolloAPI.ParentType { Backend.Objects.MonthlyBudget }
          static var __selections: [ApolloAPI.Selection] { [
            .field("month", GraphQLEnum<Backend.Month>.self),
            .field("totalSpending", Double.self),
            .field("overBudgetAmount", Double.self),
            .field("spending", [Spending].self),
            .field("carriedOverFrom", GraphQLEnum<Backend.Month>?.self),
            .field("budget", Budget.self),
          ] }
          static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
            GetMonthBudgetQuery.Data.MonthlyBudget.self,
            GetMonthBudgetQuery.Data.MonthlyBudget.AsMonthlyBudget.self
          ] }

          /// The month
          var month: GraphQLEnum<Backend.Month> { __data["month"] }
          /// Total spending for the month. Including any over budget amount
          var totalSpending: Double { __data["totalSpending"] }
          /// Amount over budget for the month. 0 means not over budget.
          var overBudgetAmount: Double { __data["overBudgetAmount"] }
          /// List of spent items
          var spending: [Spending] { __data["spending"] }
          /// The month it was carried over from
          /// If the setting are not carried over from a previous month, this value will be empty
          var carriedOverFrom: GraphQLEnum<Backend.Month>? { __data["carriedOverFrom"] }
          /// Budget details
          var budget: Budget { __data["budget"] }

          /// MonthlyBudget.AsMonthlyBudget.Spending
          ///
          /// Parent Type: `SpendingItem`
          struct Spending: Backend.SelectionSet {
            let __data: DataDict
            init(_dataDict: DataDict) { __data = _dataDict }

            static var __parentType: any ApolloAPI.ParentType { Backend.Objects.SpendingItem }
            static var __selections: [ApolloAPI.Selection] { [
              .field("__typename", String.self),
              .field("id", String.self),
              .field("amount", Double.self),
              .field("date", String.self),
              .field("description", String.self),
              .field("notes", String?.self),
            ] }
            static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
              GetMonthBudgetQuery.Data.MonthlyBudget.AsMonthlyBudget.Spending.self
            ] }

            /// A unique identifier
            var id: String { __data["id"] }
            /// The dollar amount
            var amount: Double { __data["amount"] }
            /// The date
            var date: String { __data["date"] }
            /// Description of the purchase
            var description: String { __data["description"] }
            /// Additional notes
            var notes: String? { __data["notes"] }
          }

          /// MonthlyBudget.AsMonthlyBudget.Budget
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
              GetMonthBudgetQuery.Data.MonthlyBudget.AsMonthlyBudget.Budget.self
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
        }

        /// MonthlyBudget.AsGraphQLErrorObject
        ///
        /// Parent Type: `GraphQLErrorObject`
        struct AsGraphQLErrorObject: Backend.InlineFragment {
          let __data: DataDict
          init(_dataDict: DataDict) { __data = _dataDict }

          typealias RootEntityType = GetMonthBudgetQuery.Data.MonthlyBudget
          static var __parentType: any ApolloAPI.ParentType { Backend.Objects.GraphQLErrorObject }
          static var __selections: [ApolloAPI.Selection] { [
            .field("code", GraphQLEnum<Backend.GraphQLErrorCode>.self),
            .field("message", String.self),
          ] }
          static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
            GetMonthBudgetQuery.Data.MonthlyBudget.self,
            GetMonthBudgetQuery.Data.MonthlyBudget.AsGraphQLErrorObject.self
          ] }

          var code: GraphQLEnum<Backend.GraphQLErrorCode> { __data["code"] }
          var message: String { __data["message"] }
        }
      }
    }
  }

}