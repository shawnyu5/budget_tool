// @generated
// This file was automatically generated and should not be edited.

@_spi(Internal) @_spi(Unsafe) import ApolloAPI

extension BudgetApp {
  struct UpdateBudgetConfigInput: InputObject {
    private(set) var __data: InputDict

    init(_ data: InputDict) {
      __data = data
    }

    init(
      year: String,
      month: GraphQLEnum<Month>,
      budgetConfig: BudgetConfigInput
    ) {
      __data = InputDict([
        "year": year,
        "month": month,
        "budgetConfig": budgetConfig
      ])
    }

    /// The year of the budget to update
    var year: String {
      get { __data["year"] }
      set { __data["year"] = newValue }
    }

    /// The month of the budget to update
    var month: GraphQLEnum<Month> {
      get { __data["month"] }
      set { __data["month"] = newValue }
    }

    /// The new budget
    var budgetConfig: BudgetConfigInput {
      get { __data["budgetConfig"] }
      set { __data["budgetConfig"] = newValue }
    }
  }

}