// @generated
// This file was automatically generated and should not be edited.

@_spi(Internal) @_spi(Unsafe) import ApolloAPI

extension Backend {
  /// A single transaction
  struct SpendingItemInput: InputObject {
    private(set) var __data: InputDict

    init(_ data: InputDict) {
      __data = data
    }

    init(
      id: String,
      amount: Double,
      date: String,
      description: String,
      notes: GraphQLNullable<String> = nil
    ) {
      __data = InputDict([
        "id": id,
        "amount": amount,
        "date": date,
        "description": description,
        "notes": notes
      ])
    }

    /// A unique identifier
    var id: String {
      get { __data["id"] }
      set { __data["id"] = newValue }
    }

    /// The dollar amount
    var amount: Double {
      get { __data["amount"] }
      set { __data["amount"] = newValue }
    }

    /// The date
    var date: String {
      get { __data["date"] }
      set { __data["date"] = newValue }
    }

    /// Description of the purchase
    var description: String {
      get { __data["description"] }
      set { __data["description"] = newValue }
    }

    /// Additional notes
    var notes: GraphQLNullable<String> {
      get { __data["notes"] }
      set { __data["notes"] = newValue }
    }
  }

}