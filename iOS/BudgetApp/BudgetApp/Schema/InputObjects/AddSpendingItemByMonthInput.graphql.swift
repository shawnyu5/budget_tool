// @generated
// This file was automatically generated and should not be edited.

@_spi(Internal) @_spi(Unsafe) import ApolloAPI

extension Backend {
  struct AddSpendingItemByMonthInput: InputObject {
    private(set) var __data: InputDict

    init(_ data: InputDict) {
      __data = data
    }

    init(
      year: String,
      month: GraphQLEnum<Month>,
      spendingItem: SpendingItemInput
    ) {
      __data = InputDict([
        "year": year,
        "month": month,
        "spendingItem": spendingItem
      ])
    }

    var year: String {
      get { __data["year"] }
      set { __data["year"] = newValue }
    }

    var month: GraphQLEnum<Month> {
      get { __data["month"] }
      set { __data["month"] = newValue }
    }

    var spendingItem: SpendingItemInput {
      get { __data["spendingItem"] }
      set { __data["spendingItem"] = newValue }
    }
  }

}