// @generated
// This file was automatically generated and should not be edited.

@_spi(Internal) @_spi(Unsafe) import ApolloAPI

extension Backend {
  struct UpdateSpendingItemByIdInput: InputObject {
    private(set) var __data: InputDict

    init(_ data: InputDict) {
      __data = data
    }

    init(
      year: Int32,
      month: GraphQLEnum<Month>,
      spendingItem: SpendingItemInput
    ) {
      __data = InputDict([
        "year": year,
        "month": month,
        "spendingItem": spendingItem
      ])
    }

    var year: Int32 {
      get { __data["year"] }
      set { __data["year"] = newValue }
    }

    var month: GraphQLEnum<Month> {
      get { __data["month"] }
      set { __data["month"] = newValue }
    }

    /// The new spending item to update
    var spendingItem: SpendingItemInput {
      get { __data["spendingItem"] }
      set { __data["spendingItem"] = newValue }
    }
  }

}