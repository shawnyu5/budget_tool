// @generated
// This file was automatically generated and should not be edited.

@_spi(Internal) @_spi(Unsafe) import ApolloAPI

extension Backend {
  struct SubscriptionInput: InputObject {
    private(set) var __data: InputDict

    init(_ data: InputDict) {
      __data = data
    }

    init(
      endpoint: String,
      p256Dh: String,
      auth: String,
      expirationTime: GraphQLNullable<Int32> = nil
    ) {
      __data = InputDict([
        "endpoint": endpoint,
        "p256Dh": p256Dh,
        "auth": auth,
        "expirationTime": expirationTime
      ])
    }

    var endpoint: String {
      get { __data["endpoint"] }
      set { __data["endpoint"] = newValue }
    }

    var p256Dh: String {
      get { __data["p256Dh"] }
      set { __data["p256Dh"] = newValue }
    }

    var auth: String {
      get { __data["auth"] }
      set { __data["auth"] = newValue }
    }

    var expirationTime: GraphQLNullable<Int32> {
      get { __data["expirationTime"] }
      set { __data["expirationTime"] = newValue }
    }
  }

}