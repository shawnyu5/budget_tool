// @generated
// This file was automatically generated and should not be edited.

@_spi(Internal) @_spi(Unsafe) import ApolloAPI

extension Backend {
  struct DeleteSpendingItemByIdInput: InputObject {
    private(set) var __data: InputDict

    init(_ data: InputDict) {
      __data = data
    }

    init(
      year: Int32,
      month: GraphQLEnum<Month>,
      id: String
    ) {
      __data = InputDict([
        "year": year,
        "month": month,
        "id": id
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

    /// The ID of the spending item to delete
    var id: String {
      get { __data["id"] }
      set { __data["id"] = newValue }
    }
  }

}