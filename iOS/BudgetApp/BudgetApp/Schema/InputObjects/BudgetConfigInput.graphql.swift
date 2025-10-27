// @generated
// This file was automatically generated and should not be edited.

@_spi(Internal) @_spi(Unsafe) import ApolloAPI

extension BudgetApp {
  struct BudgetConfigInput: InputObject {
    private(set) var __data: InputDict

    init(_ data: InputDict) {
      __data = data
    }

    init(
      totalAllocation: Double,
      shawnPercentageAllocation: Double,
      shawnContributionAmount: Double,
      maggiePercentageAllocation: Double,
      maggieContributionAmount: Double
    ) {
      __data = InputDict([
        "totalAllocation": totalAllocation,
        "shawnPercentageAllocation": shawnPercentageAllocation,
        "shawnContributionAmount": shawnContributionAmount,
        "maggiePercentageAllocation": maggiePercentageAllocation,
        "maggieContributionAmount": maggieContributionAmount
      ])
    }

    /// Total allocated budget
    var totalAllocation: Double {
      get { __data["totalAllocation"] }
      set { __data["totalAllocation"] = newValue }
    }

    /// Shawn percentage allocation
    var shawnPercentageAllocation: Double {
      get { __data["shawnPercentageAllocation"] }
      set { __data["shawnPercentageAllocation"] = newValue }
    }

    /// Shawn contribution amount. The frontend is responsible for computing this value
    var shawnContributionAmount: Double {
      get { __data["shawnContributionAmount"] }
      set { __data["shawnContributionAmount"] = newValue }
    }

    /// Maggie percentage allocation
    var maggiePercentageAllocation: Double {
      get { __data["maggiePercentageAllocation"] }
      set { __data["maggiePercentageAllocation"] = newValue }
    }

    /// Maggie contribution amount. The frontend is responsible for computing this value
    var maggieContributionAmount: Double {
      get { __data["maggieContributionAmount"] }
      set { __data["maggieContributionAmount"] = newValue }
    }
  }

}