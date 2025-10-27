// @generated
// This file was automatically generated and should not be edited.

import ApolloAPI

protocol BudgetApp_SelectionSet: ApolloAPI.SelectionSet & ApolloAPI.RootSelectionSet
where Schema == BudgetApp.SchemaMetadata {}

protocol BudgetApp_InlineFragment: ApolloAPI.SelectionSet & ApolloAPI.InlineFragment
where Schema == BudgetApp.SchemaMetadata {}

protocol BudgetApp_MutableSelectionSet: ApolloAPI.MutableRootSelectionSet
where Schema == BudgetApp.SchemaMetadata {}

protocol BudgetApp_MutableInlineFragment: ApolloAPI.MutableSelectionSet & ApolloAPI.InlineFragment
where Schema == BudgetApp.SchemaMetadata {}

extension BudgetApp {
  typealias SelectionSet = BudgetApp_SelectionSet

  typealias InlineFragment = BudgetApp_InlineFragment

  typealias MutableSelectionSet = BudgetApp_MutableSelectionSet

  typealias MutableInlineFragment = BudgetApp_MutableInlineFragment

  enum SchemaMetadata: ApolloAPI.SchemaMetadata {
    static let configuration: any ApolloAPI.SchemaConfiguration.Type = SchemaConfiguration.self

    static func objectType(forTypename typename: String) -> ApolloAPI.Object? {
      switch typename {
      case "BudgetConfig": return BudgetApp.Objects.BudgetConfig
      case "FrontendConfig": return BudgetApp.Objects.FrontendConfig
      case "GraphQLErrorObject": return BudgetApp.Objects.GraphQLErrorObject
      case "MonthlyBudget": return BudgetApp.Objects.MonthlyBudget
      case "MutationRoot": return BudgetApp.Objects.MutationRoot
      case "NotificationKeys": return BudgetApp.Objects.NotificationKeys
      case "NotificationSubscription": return BudgetApp.Objects.NotificationSubscription
      case "QueryRoot": return BudgetApp.Objects.QueryRoot
      case "SpendingItem": return BudgetApp.Objects.SpendingItem
      case "User": return BudgetApp.Objects.User
      default: return nil
      }
    }
  }

  enum Objects {}
  enum Interfaces {}
  enum Unions {}

}