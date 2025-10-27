// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI
@_spi(Execution) @_spi(Unsafe) import ApolloAPI

extension Backend {
  struct UpdateMonthlyBudgetConfigMutation: GraphQLMutation {
    static let operationName: String = "UpdateMonthlyBudgetConfig"
    static let operationDocument: ApolloAPI.OperationDocument = .init(
      definition: .init(
        #"mutation UpdateMonthlyBudgetConfig($inputs: UpdateBudgetConfigInput!) { updateBudgetConfig(inputs: $inputs) { __typename ... on BudgetConfig { __typename totalAllocation shawnPercentageAllocation shawnContributionAmount maggiePercentageAllocation maggieContributionAmount } } }"#
      ))

    public var inputs: UpdateBudgetConfigInput

    public init(inputs: UpdateBudgetConfigInput) {
      self.inputs = inputs
    }

    @_spi(Unsafe) public var __variables: Variables? { ["inputs": inputs] }

    struct Data: Backend.SelectionSet {
      let __data: DataDict
      init(_dataDict: DataDict) { __data = _dataDict }

      static var __parentType: any ApolloAPI.ParentType { Backend.Objects.MutationRoot }
      static var __selections: [ApolloAPI.Selection] { [
        .field("updateBudgetConfig", UpdateBudgetConfig.self, arguments: ["inputs": .variable("inputs")]),
      ] }
      static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
        UpdateMonthlyBudgetConfigMutation.Data.self
      ] }

      /// Update the budget configuration for a specific month
      var updateBudgetConfig: UpdateBudgetConfig { __data["updateBudgetConfig"] }

      /// UpdateBudgetConfig
      ///
      /// Parent Type: `MonthlyBudgetConfigResponse`
      struct UpdateBudgetConfig: Backend.SelectionSet {
        let __data: DataDict
        init(_dataDict: DataDict) { __data = _dataDict }

        static var __parentType: any ApolloAPI.ParentType { Backend.Unions.MonthlyBudgetConfigResponse }
        static var __selections: [ApolloAPI.Selection] { [
          .field("__typename", String.self),
          .inlineFragment(AsBudgetConfig.self),
        ] }
        static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
          UpdateMonthlyBudgetConfigMutation.Data.UpdateBudgetConfig.self
        ] }

        var asBudgetConfig: AsBudgetConfig? { _asInlineFragment() }

        /// UpdateBudgetConfig.AsBudgetConfig
        ///
        /// Parent Type: `BudgetConfig`
        struct AsBudgetConfig: Backend.InlineFragment {
          let __data: DataDict
          init(_dataDict: DataDict) { __data = _dataDict }

          typealias RootEntityType = UpdateMonthlyBudgetConfigMutation.Data.UpdateBudgetConfig
          static var __parentType: any ApolloAPI.ParentType { Backend.Objects.BudgetConfig }
          static var __selections: [ApolloAPI.Selection] { [
            .field("totalAllocation", Double.self),
            .field("shawnPercentageAllocation", Double.self),
            .field("shawnContributionAmount", Double.self),
            .field("maggiePercentageAllocation", Double.self),
            .field("maggieContributionAmount", Double.self),
          ] }
          static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
            UpdateMonthlyBudgetConfigMutation.Data.UpdateBudgetConfig.self,
            UpdateMonthlyBudgetConfigMutation.Data.UpdateBudgetConfig.AsBudgetConfig.self
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
      }
    }
  }

}