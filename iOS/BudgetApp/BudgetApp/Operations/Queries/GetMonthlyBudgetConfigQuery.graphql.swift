// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI
@_spi(Execution) @_spi(Unsafe) import ApolloAPI

extension Backend {
  struct GetMonthlyBudgetConfigQuery: GraphQLQuery {
    static let operationName: String = "GetMonthlyBudgetConfig"
    static let operationDocument: ApolloAPI.OperationDocument = .init(
      definition: .init(
        #"query GetMonthlyBudgetConfig($year: Int!, $month: Month!) { monthlyBudgetConfig(year: $year, month: $month) { __typename ... on BudgetConfig { __typename totalAllocation shawnPercentageAllocation shawnContributionAmount maggiePercentageAllocation maggieContributionAmount } ... on GraphQLErrorObject { __typename code message } } }"#
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
        .field("monthlyBudgetConfig", MonthlyBudgetConfig.self, arguments: [
          "year": .variable("year"),
          "month": .variable("month")
        ]),
      ] }
      static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
        GetMonthlyBudgetConfigQuery.Data.self
      ] }

      var monthlyBudgetConfig: MonthlyBudgetConfig { __data["monthlyBudgetConfig"] }

      /// MonthlyBudgetConfig
      ///
      /// Parent Type: `MonthlyBudgetConfigResponse`
      struct MonthlyBudgetConfig: Backend.SelectionSet {
        let __data: DataDict
        init(_dataDict: DataDict) { __data = _dataDict }

        static var __parentType: any ApolloAPI.ParentType { Backend.Unions.MonthlyBudgetConfigResponse }
        static var __selections: [ApolloAPI.Selection] { [
          .field("__typename", String.self),
          .inlineFragment(AsBudgetConfig.self),
          .inlineFragment(AsGraphQLErrorObject.self),
        ] }
        static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
          GetMonthlyBudgetConfigQuery.Data.MonthlyBudgetConfig.self
        ] }

        var asBudgetConfig: AsBudgetConfig? { _asInlineFragment() }
        var asGraphQLErrorObject: AsGraphQLErrorObject? { _asInlineFragment() }

        /// MonthlyBudgetConfig.AsBudgetConfig
        ///
        /// Parent Type: `BudgetConfig`
        struct AsBudgetConfig: Backend.InlineFragment {
          let __data: DataDict
          init(_dataDict: DataDict) { __data = _dataDict }

          typealias RootEntityType = GetMonthlyBudgetConfigQuery.Data.MonthlyBudgetConfig
          static var __parentType: any ApolloAPI.ParentType { Backend.Objects.BudgetConfig }
          static var __selections: [ApolloAPI.Selection] { [
            .field("totalAllocation", Double.self),
            .field("shawnPercentageAllocation", Double.self),
            .field("shawnContributionAmount", Double.self),
            .field("maggiePercentageAllocation", Double.self),
            .field("maggieContributionAmount", Double.self),
          ] }
          static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
            GetMonthlyBudgetConfigQuery.Data.MonthlyBudgetConfig.self,
            GetMonthlyBudgetConfigQuery.Data.MonthlyBudgetConfig.AsBudgetConfig.self
          ] }

          /// Total allocated budget
          var totalAllocation: Double { __data["totalAllocation"] }
          /// Shawn percentage allocation
          var shawnPercentageAllocation: Double { __data["shawnPercentageAllocation"] }
          /// Shawn contribution amount. The frontend is responsible for computing this value
          var shawnContributionAmount: Double { __data["shawnContributionAmount"] }
          /// Maggie percentage allocation
          var maggiePercentageAllocation: Double { __data["maggiePercentageAllocation"] }
          /// Maggie contribution amount. The frontend is responsible for computing this value
          var maggieContributionAmount: Double { __data["maggieContributionAmount"] }
        }

        /// MonthlyBudgetConfig.AsGraphQLErrorObject
        ///
        /// Parent Type: `GraphQLErrorObject`
        struct AsGraphQLErrorObject: Backend.InlineFragment {
          let __data: DataDict
          init(_dataDict: DataDict) { __data = _dataDict }

          typealias RootEntityType = GetMonthlyBudgetConfigQuery.Data.MonthlyBudgetConfig
          static var __parentType: any ApolloAPI.ParentType { Backend.Objects.GraphQLErrorObject }
          static var __selections: [ApolloAPI.Selection] { [
            .field("code", GraphQLEnum<Backend.GraphQLErrorCode>.self),
            .field("message", String.self),
          ] }
          static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
            GetMonthlyBudgetConfigQuery.Data.MonthlyBudgetConfig.self,
            GetMonthlyBudgetConfigQuery.Data.MonthlyBudgetConfig.AsGraphQLErrorObject.self
          ] }

          var code: GraphQLEnum<Backend.GraphQLErrorCode> { __data["code"] }
          var message: String { __data["message"] }
        }
      }
    }
  }

}