// @generated
// This file was automatically generated and should not be edited.

import ApolloAPI

protocol Backend_SelectionSet: ApolloAPI.SelectionSet & ApolloAPI.RootSelectionSet
where Schema == Backend.SchemaMetadata {}

protocol Backend_InlineFragment: ApolloAPI.SelectionSet & ApolloAPI.InlineFragment
where Schema == Backend.SchemaMetadata {}

protocol Backend_MutableSelectionSet: ApolloAPI.MutableRootSelectionSet
where Schema == Backend.SchemaMetadata {}

protocol Backend_MutableInlineFragment: ApolloAPI.MutableSelectionSet & ApolloAPI.InlineFragment
where Schema == Backend.SchemaMetadata {}

extension Backend {
  typealias SelectionSet = Backend_SelectionSet

  typealias InlineFragment = Backend_InlineFragment

  typealias MutableSelectionSet = Backend_MutableSelectionSet

  typealias MutableInlineFragment = Backend_MutableInlineFragment

  enum SchemaMetadata: ApolloAPI.SchemaMetadata {
    static let configuration: any ApolloAPI.SchemaConfiguration.Type = SchemaConfiguration.self

    static func objectType(forTypename typename: String) -> ApolloAPI.Object? {
      switch typename {
      case "BudgetConfig": return Backend.Objects.BudgetConfig
      case "FrontendConfig": return Backend.Objects.FrontendConfig
      case "GraphQLErrorObject": return Backend.Objects.GraphQLErrorObject
      case "MonthlyBudget": return Backend.Objects.MonthlyBudget
      case "MutationRoot": return Backend.Objects.MutationRoot
      case "NotificationKeys": return Backend.Objects.NotificationKeys
      case "NotificationSubscription": return Backend.Objects.NotificationSubscription
      case "QueryRoot": return Backend.Objects.QueryRoot
      case "SpendingItem": return Backend.Objects.SpendingItem
      case "User": return Backend.Objects.User
      default: return nil
      }
    }
  }

  enum Objects {}
  enum Interfaces {}
  enum Unions {}

}