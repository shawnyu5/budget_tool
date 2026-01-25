import { GraphQLClient, RequestOptions } from 'graphql-request';
import gql from 'graphql-tag';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
type GraphQLClientRequestHeaders = RequestOptions['requestHeaders'];
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type AddSpendingItemByMonthInput = {
  month: Month;
  spendingItem: SpendingItemInput;
  year: Scalars['String']['input'];
};

export type BudgetConfig = {
  __typename?: 'BudgetConfig';
  /** Maggie contribution amount. The frontend is responsible for computing this value */
  maggieContributionAmount: Scalars['Float']['output'];
  /** Maggie percentage allocation */
  maggiePercentageAllocation: Scalars['Float']['output'];
  /** Shawn contribution amount. The frontend is responsible for computing this value */
  shawnContributionAmount: Scalars['Float']['output'];
  /** Shawn percentage allocation */
  shawnPercentageAllocation: Scalars['Float']['output'];
  /** Total allocated budget */
  totalAllocation: Scalars['Float']['output'];
};

export type BudgetConfigInput = {
  /** Maggie contribution amount. The frontend is responsible for computing this value */
  maggieContributionAmount: Scalars['Float']['input'];
  /** Maggie percentage allocation */
  maggiePercentageAllocation: Scalars['Float']['input'];
  /** Shawn contribution amount. The frontend is responsible for computing this value */
  shawnContributionAmount: Scalars['Float']['input'];
  /** Shawn percentage allocation */
  shawnPercentageAllocation: Scalars['Float']['input'];
  /** Total allocated budget */
  totalAllocation: Scalars['Float']['input'];
};

export type DeleteSpendingItemByIdInput = {
  /** The ID of the spending item to delete */
  id: Scalars['String']['input'];
  month: Month;
  year: Scalars['Int']['input'];
};

/** Firefly related settings */
export type FireflySettings = {
  __typename?: 'FireflySettings';
  /** API key, required if `enabled` = true */
  apiKey?: Maybe<Scalars['String']['output']>;
  /** If the user has enabled Firefly integration */
  enabled: Scalars['Boolean']['output'];
  /** Base64 encoded nounce used to encrypt / decrypt the API key */
  encryptionNounce?: Maybe<Scalars['String']['output']>;
};

/** Firefly related settings */
export type FireflySettingsInput = {
  /** API key, required if `enabled` = true */
  apiKey?: InputMaybe<Scalars['String']['input']>;
  /** If the user has enabled Firefly integration */
  enabled: Scalars['Boolean']['input'];
  /** Base64 encoded nounce used to encrypt / decrypt the API key */
  encryptionNounce?: InputMaybe<Scalars['String']['input']>;
};

/** Frontend configuration */
export type FrontendConfig = {
  __typename?: 'FrontendConfig';
  /** Base 64 encoded public key used for encryption */
  encryptionPublicKey: Scalars['String']['output'];
  /** Non base 64 encoded VAPID public key used for sending notifications */
  vapidPublicKey: Scalars['String']['output'];
};

/** GraphQL error codes */
export enum GraphQlErrorCode {
  /** Failed to fetch budget for some reason. Typically response 404 */
  FailedToFetchBudget = 'FAILED_TO_FETCH_BUDGET',
  InvalidFireflyApiKey = 'INVALID_FIREFLY_API_KEY',
  /** Something went wrong on the server side. Typically response 500 */
  ServerError = 'SERVER_ERROR'
}

export type GraphQlErrorObject = {
  __typename?: 'GraphQLErrorObject';
  code: GraphQlErrorCode;
  message: Scalars['String']['output'];
};

export enum Month {
  April = 'April',
  August = 'August',
  December = 'December',
  February = 'February',
  January = 'January',
  July = 'July',
  June = 'June',
  March = 'March',
  May = 'May',
  November = 'November',
  October = 'October',
  September = 'September'
}

/** Budget details for single month */
export type MonthlyBudget = {
  __typename?: 'MonthlyBudget';
  /** Budget details */
  budget: BudgetConfig;
  /**
   * The month it was carried over from
   * If the setting are not carried over from a previous month, this value will be empty
   */
  carriedOverFrom?: Maybe<Month>;
  /** The month */
  month: Month;
  /** Amount over budget for the month. 0 means not over budget. */
  overBudgetAmount: Scalars['Float']['output'];
  /** List of spent items */
  spending: Array<SpendingItem>;
  /** Total spending for the month. Including any over budget amount */
  totalSpending: Scalars['Float']['output'];
};

export type MonthlyBudgetConfigResponse = BudgetConfig | GraphQlErrorObject;

/** Budget details for single month */
export type MonthlyBudgetInput = {
  /** Budget details */
  budget: BudgetConfigInput;
  /**
   * The month it was carried over from
   * If the setting are not carried over from a previous month, this value will be empty
   */
  carriedOverFrom?: InputMaybe<Month>;
  /** The month */
  month: Month;
  /** Amount over budget for the month. 0 means not over budget. */
  overBudgetAmount: Scalars['Float']['input'];
  /** List of spent items */
  spending: Array<SpendingItemInput>;
  /** Total spending for the month. Including any over budget amount */
  totalSpending: Scalars['Float']['input'];
};

export type MonthlyBudgetResponse = GraphQlErrorObject | MonthlyBudget;

export type MutationRoot = {
  __typename?: 'MutationRoot';
  /** Add a spending item to a month */
  addSpendingItemByMonth: MonthlyBudgetResponse;
  /** Delete a spending item by ID. If the item doesnt exist, this handler will not do anything */
  deleteSpendingItemById: MonthlyBudgetResponse;
  me: UpdateMeResponse;
  /**
   * Save a notification subscription for a user
   * The user is extracted from the JWT
   */
  saveSubscription: User;
  /** Update the budget for a specific month */
  updateMonthlyBudget: MonthlyBudgetResponse;
  /** Update the budget configuration for a specific month */
  updateMonthlyBudgetConfig: UpdateBudgetConfigResponse;
  /** Update a spending item by ID */
  updateSpendingItemById: MonthlyBudgetResponse;
};


export type MutationRootAddSpendingItemByMonthArgs = {
  inputs: AddSpendingItemByMonthInput;
};


export type MutationRootDeleteSpendingItemByIdArgs = {
  inputs: DeleteSpendingItemByIdInput;
};


export type MutationRootMeArgs = {
  inputs: UpdateMe;
};


export type MutationRootSaveSubscriptionArgs = {
  subscription: SubscriptionInput;
};


export type MutationRootUpdateMonthlyBudgetArgs = {
  inputs: UpdateMonthlyBudgetInput;
};


export type MutationRootUpdateMonthlyBudgetConfigArgs = {
  inputs: UpdateBudgetConfigInput;
};


export type MutationRootUpdateSpendingItemByIdArgs = {
  inputs: UpdateSpendingItemByIdInput;
};

export type NotificationKeys = {
  __typename?: 'NotificationKeys';
  auth: Scalars['String']['output'];
  p256Dh: Scalars['String']['output'];
};

export type NotificationKeysInput = {
  auth: Scalars['String']['input'];
  p256Dh: Scalars['String']['input'];
};

/** Stuff the browser sends to do the notification handshake */
export type NotificationSubscription = {
  __typename?: 'NotificationSubscription';
  endpoint: Scalars['String']['output'];
  expirationTime?: Maybe<Scalars['Int']['output']>;
  keys: NotificationKeys;
};

/** Stuff the browser sends to do the notification handshake */
export type NotificationSubscriptionInput = {
  endpoint: Scalars['String']['input'];
  expirationTime?: InputMaybe<Scalars['Int']['input']>;
  keys: NotificationKeysInput;
};

/** Root of the query */
export type QueryRoot = {
  __typename?: 'QueryRoot';
  /** Configuration for the frontend to consume */
  config: FrontendConfig;
  me: User;
  /**
   * Get the budget for a specific month in a year
   *
   * * `year`: the year
   * * `month`: the month
   */
  monthlyBudget: MonthlyBudgetResponse;
  monthlyBudgetConfig: MonthlyBudgetConfigResponse;
};


/** Root of the query */
export type QueryRootMonthlyBudgetArgs = {
  month: Month;
  year: Scalars['Int']['input'];
};


/** Root of the query */
export type QueryRootMonthlyBudgetConfigArgs = {
  month: Month;
  year: Scalars['Int']['input'];
};

/** A single transaction */
export type SpendingItem = {
  __typename?: 'SpendingItem';
  /** The dollar amount */
  amount: Scalars['Float']['output'];
  /** The date */
  date: Scalars['String']['output'];
  /** Description of the purchase */
  description: Scalars['String']['output'];
  /** A unique identifier */
  id: Scalars['String']['output'];
  /** Additional notes */
  notes?: Maybe<Scalars['String']['output']>;
};

/** A single transaction */
export type SpendingItemInput = {
  /** The dollar amount */
  amount: Scalars['Float']['input'];
  /** The date */
  date: Scalars['String']['input'];
  /** Description of the purchase */
  description: Scalars['String']['input'];
  /** A unique identifier */
  id: Scalars['String']['input'];
  /** Additional notes */
  notes?: InputMaybe<Scalars['String']['input']>;
};

export type SubscriptionInput = {
  auth: Scalars['String']['input'];
  endpoint: Scalars['String']['input'];
  expirationTime?: InputMaybe<Scalars['Int']['input']>;
  p256Dh: Scalars['String']['input'];
};

export type UpdateBudgetConfigInput = {
  /** The new budget config */
  budgetConfig: BudgetConfigInput;
  /** Firefly related settings for the current user */
  firefly: FireflySettingsInput;
  /** The month of the budget to update */
  month: Month;
  /** The year of the budget to update */
  year: Scalars['Int']['input'];
};

export type UpdateBudgetConfigResponse = GraphQlErrorObject | UpdateBudgetResponse;

export type UpdateBudgetResponse = {
  __typename?: 'UpdateBudgetResponse';
  success: Scalars['Boolean']['output'];
};

export type UpdateMe = {
  user: UserInput;
};

export type UpdateMeResponse = {
  __typename?: 'UpdateMeResponse';
  success: Scalars['Boolean']['output'];
};

export type UpdateMonthlyBudgetInput = {
  budget: MonthlyBudgetInput;
  month: Month;
  year: Scalars['Int']['input'];
};

export type UpdateSpendingItemByIdInput = {
  month: Month;
  /** The new spending item to update */
  spendingItem: SpendingItemInput;
  year: Scalars['Int']['input'];
};

/** Represents a user */
export type User = {
  __typename?: 'User';
  firefly?: Maybe<FireflySettings>;
  lastUpdated?: Maybe<Scalars['String']['output']>;
  /** Notification subscription */
  notificationSubscription: NotificationSubscription;
  /** Username of the user */
  username: Scalars['String']['output'];
};

/** Represents a user */
export type UserInput = {
  firefly?: InputMaybe<FireflySettingsInput>;
  lastUpdated?: InputMaybe<Scalars['String']['input']>;
  /** Notification subscription */
  notificationSubscription: NotificationSubscriptionInput;
  /** Username of the user */
  username: Scalars['String']['input'];
};

export type SaveSubscriptionMutationVariables = Exact<{
  subscription: SubscriptionInput;
}>;


export type SaveSubscriptionMutation = { __typename?: 'MutationRoot', saveSubscription: { __typename?: 'User', username: string, notificationSubscription: { __typename?: 'NotificationSubscription', endpoint: string, expirationTime?: number | null, keys: { __typename?: 'NotificationKeys', p256Dh: string, auth: string } } } };

export type UpdateMonthlyBudgetConfigMutationVariables = Exact<{
  inputs: UpdateBudgetConfigInput;
}>;


export type UpdateMonthlyBudgetConfigMutation = { __typename?: 'MutationRoot', updateMonthlyBudgetConfig: { __typename: 'GraphQLErrorObject', code: GraphQlErrorCode, message: string } | { __typename?: 'UpdateBudgetResponse', success: boolean } };

export type UpdateMonthlyBudgetMutationVariables = Exact<{
  inputs: UpdateMonthlyBudgetInput;
}>;


export type UpdateMonthlyBudgetMutation = { __typename?: 'MutationRoot', updateMonthlyBudget: { __typename: 'GraphQLErrorObject', code: GraphQlErrorCode, message: string } | { __typename: 'MonthlyBudget', month: Month, totalSpending: number, overBudgetAmount: number, carriedOverFrom?: Month | null, spending: Array<{ __typename?: 'SpendingItem', id: string, amount: number, date: string, description: string, notes?: string | null }>, budget: { __typename?: 'BudgetConfig', totalAllocation: number, maggiePercentageAllocation: number, maggieContributionAmount: number, shawnPercentageAllocation: number, shawnContributionAmount: number } } };

export type GraphQlErrorFieldsFragment = { __typename: 'GraphQLErrorObject', code: GraphQlErrorCode, message: string };

export type SettingsPageDataQueryVariables = Exact<{
  year: Scalars['Int']['input'];
  month: Month;
}>;


export type SettingsPageDataQuery = { __typename?: 'QueryRoot', monthlyBudgetConfig: { __typename: 'BudgetConfig', totalAllocation: number, shawnPercentageAllocation: number, shawnContributionAmount: number, maggiePercentageAllocation: number, maggieContributionAmount: number } | { __typename: 'GraphQLErrorObject', code: GraphQlErrorCode, message: string }, me: { __typename?: 'User', username: string, firefly?: { __typename?: 'FireflySettings', enabled: boolean, apiKey?: string | null } | null } };

export type GetMonthBudgetQueryVariables = Exact<{
  year: Scalars['Int']['input'];
  month: Month;
}>;


export type GetMonthBudgetQuery = { __typename?: 'QueryRoot', monthlyBudget: { __typename: 'GraphQLErrorObject', code: GraphQlErrorCode, message: string } | { __typename: 'MonthlyBudget', month: Month, totalSpending: number, overBudgetAmount: number, carriedOverFrom?: Month | null, spending: Array<{ __typename?: 'SpendingItem', id: string, amount: number, date: string, description: string, notes?: string | null }>, budget: { __typename?: 'BudgetConfig', totalAllocation: number, maggiePercentageAllocation: number, maggieContributionAmount: number, shawnPercentageAllocation: number, shawnContributionAmount: number } } };

export type GetConfigQueryVariables = Exact<{ [key: string]: never; }>;


export type GetConfigQuery = { __typename?: 'QueryRoot', config: { __typename?: 'FrontendConfig', encryptionPublicKey: string, vapidPublicKey: string } };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { __typename?: 'QueryRoot', me: { __typename?: 'User', username: string } };

export type SpendingItemFormQueryVariables = Exact<{
  year: Scalars['Int']['input'];
  month: Month;
}>;


export type SpendingItemFormQuery = { __typename?: 'QueryRoot', monthlyBudgetConfig: { __typename?: 'BudgetConfig', totalAllocation: number, shawnPercentageAllocation: number, shawnContributionAmount: number, maggiePercentageAllocation: number, maggieContributionAmount: number } | { __typename: 'GraphQLErrorObject', code: GraphQlErrorCode, message: string } };

export const GraphQlErrorFieldsFragmentDoc = gql`
    fragment GraphQLErrorFields on GraphQLErrorObject {
  __typename
  code
  message
}
    `;
export const SaveSubscriptionDocument = gql`
    mutation saveSubscription($subscription: SubscriptionInput!) {
  saveSubscription(subscription: $subscription) {
    username
    notificationSubscription {
      endpoint
      expirationTime
      keys {
        p256Dh
        auth
      }
    }
  }
}
    `;
export const UpdateMonthlyBudgetConfigDocument = gql`
    mutation UpdateMonthlyBudgetConfig($inputs: UpdateBudgetConfigInput!) {
  updateMonthlyBudgetConfig(inputs: $inputs) {
    ... on UpdateBudgetResponse {
      success
    }
    ... on GraphQLErrorObject {
      __typename
      code
      message
    }
  }
}
    `;
export const UpdateMonthlyBudgetDocument = gql`
    mutation UpdateMonthlyBudget($inputs: UpdateMonthlyBudgetInput!) {
  updateMonthlyBudget(inputs: $inputs) {
    ... on MonthlyBudget {
      __typename
      month
      totalSpending
      overBudgetAmount
      spending {
        id
        amount
        date
        description
        notes
      }
      carriedOverFrom
      budget {
        totalAllocation
        maggiePercentageAllocation
        maggieContributionAmount
        shawnPercentageAllocation
        shawnContributionAmount
      }
    }
    ... on GraphQLErrorObject {
      __typename
      code
      message
    }
  }
}
    `;
export const SettingsPageDataDocument = gql`
    query SettingsPageData($year: Int!, $month: Month!) {
  monthlyBudgetConfig(year: $year, month: $month) {
    ... on BudgetConfig {
      __typename
      totalAllocation
      shawnPercentageAllocation
      shawnContributionAmount
      maggiePercentageAllocation
      maggieContributionAmount
    }
    ...GraphQLErrorFields
  }
  me {
    username
    firefly {
      enabled
      apiKey
    }
  }
}
    ${GraphQlErrorFieldsFragmentDoc}`;
export const GetMonthBudgetDocument = gql`
    query GetMonthBudget($year: Int!, $month: Month!) {
  monthlyBudget(year: $year, month: $month) {
    __typename
    ... on MonthlyBudget {
      __typename
      month
      totalSpending
      overBudgetAmount
      spending {
        id
        amount
        date
        description
        notes
      }
      carriedOverFrom
      budget {
        totalAllocation
        maggiePercentageAllocation
        maggieContributionAmount
        shawnPercentageAllocation
        shawnContributionAmount
      }
    }
    ...GraphQLErrorFields
  }
}
    ${GraphQlErrorFieldsFragmentDoc}`;
export const GetConfigDocument = gql`
    query getConfig {
  config {
    encryptionPublicKey
    vapidPublicKey
  }
}
    `;
export const MeDocument = gql`
    query Me {
  me {
    username
  }
}
    `;
export const SpendingItemFormDocument = gql`
    query SpendingItemForm($year: Int!, $month: Month!) {
  monthlyBudgetConfig(year: $year, month: $month) {
    ... on BudgetConfig {
      totalAllocation
      shawnPercentageAllocation
      shawnContributionAmount
      maggiePercentageAllocation
      maggieContributionAmount
    }
    ...GraphQLErrorFields
  }
}
    ${GraphQlErrorFieldsFragmentDoc}`;

export type SdkFunctionWrapper = <T>(action: (requestHeaders?:Record<string, string>) => Promise<T>, operationName: string, operationType?: string, variables?: any) => Promise<T>;


const defaultWrapper: SdkFunctionWrapper = (action, _operationName, _operationType, _variables) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    saveSubscription(variables: SaveSubscriptionMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<SaveSubscriptionMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<SaveSubscriptionMutation>({ document: SaveSubscriptionDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'saveSubscription', 'mutation', variables);
    },
    UpdateMonthlyBudgetConfig(variables: UpdateMonthlyBudgetConfigMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpdateMonthlyBudgetConfigMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateMonthlyBudgetConfigMutation>({ document: UpdateMonthlyBudgetConfigDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpdateMonthlyBudgetConfig', 'mutation', variables);
    },
    UpdateMonthlyBudget(variables: UpdateMonthlyBudgetMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpdateMonthlyBudgetMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateMonthlyBudgetMutation>({ document: UpdateMonthlyBudgetDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpdateMonthlyBudget', 'mutation', variables);
    },
    SettingsPageData(variables: SettingsPageDataQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<SettingsPageDataQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<SettingsPageDataQuery>({ document: SettingsPageDataDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'SettingsPageData', 'query', variables);
    },
    GetMonthBudget(variables: GetMonthBudgetQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetMonthBudgetQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetMonthBudgetQuery>({ document: GetMonthBudgetDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetMonthBudget', 'query', variables);
    },
    getConfig(variables?: GetConfigQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetConfigQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetConfigQuery>({ document: GetConfigDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'getConfig', 'query', variables);
    },
    Me(variables?: MeQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<MeQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<MeQuery>({ document: MeDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'Me', 'query', variables);
    },
    SpendingItemForm(variables: SpendingItemFormQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<SpendingItemFormQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<SpendingItemFormQuery>({ document: SpendingItemFormDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'SpendingItemForm', 'query', variables);
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;