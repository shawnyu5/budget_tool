import { Decimal } from 'decimal.js';
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
  /**
   * Implement the DateTime<FixedOffset> scalar
   *
   * The input/output is a string in RFC3339 format.
   */
  DateTime: { input: Date; output: Date; }
  Decimal: { input: Decimal; output: Decimal; }
  /**
   * A UUID is a unique 128-bit number, stored as 16 octets. UUIDs are parsed as
   * Strings within GraphQL. UUIDs are used to assign unique identifiers to
   * entities without requiring a central allocating authority.
   *
   * # References
   *
   * * [Wikipedia: Universally Unique Identifier](http://en.wikipedia.org/wiki/Universally_unique_identifier)
   * * [RFC4122: A Universally Unique Identifier (UUID) URN Namespace](http://tools.ietf.org/html/rfc4122)
   */
  UUID: { input: any; output: any; }
};

export type AddTransactionResponseV2 = {
  __typename?: 'AddTransactionResponseV2';
  success: Scalars['Boolean']['output'];
};

export type AddTransactionV2Input = {
  month: Month;
  transaction: TransactionInput;
  year: Scalars['Int']['input'];
};

export type DeleteTransactionByIdV2Input = {
  transactionId: Scalars['UUID']['input'];
};

export type DeleteTransactionByIdV2Response = {
  __typename?: 'DeleteTransactionByIdV2Response';
  success: Scalars['Boolean']['output'];
};

/** Firefly related settings */
export type FireflySettingsV2 = {
  __typename?: 'FireflySettingsV2';
  /** Encrypted firefly API key, required if `enabled` = true */
  apiKey?: Maybe<Scalars['String']['output']>;
  /** If the user has enabled Firefly integration */
  enabled: Scalars['Boolean']['output'];
  /** The source account to create the transaction in */
  sourceAccount?: Maybe<Scalars['String']['output']>;
};

/** Firefly related settings */
export type FireflySettingsV2Input = {
  /** Encrypted firefly API key, required if `enabled` = true */
  apiKey?: InputMaybe<Scalars['String']['input']>;
  /** If the user has enabled Firefly integration */
  enabled: Scalars['Boolean']['input'];
  /** The source account to create the transaction in */
  sourceAccount?: InputMaybe<Scalars['String']['input']>;
};

export type FireflyV2SuccessResponse = {
  __typename?: 'FireflyV2SuccessResponse';
  /** List of accounts this user has */
  accounts: Array<Scalars['String']['output']>;
};

/** Frontend configuration */
export type FrontendConfig = {
  __typename?: 'FrontendConfig';
  /** Base 64 encoded public key used for encryption */
  encryptionPublicKey: Scalars['String']['output'];
  /** Non base 64 encoded VAPID public key used for sending notifications */
  vapidPublicKey: Scalars['String']['output'];
};

export type GetTransactionDescriptionsInput = {
  /** Filter by description that contains this string */
  contains?: InputMaybe<Scalars['String']['input']>;
  /** The number of results to return */
  limit: Scalars['Int']['input'];
};

export type GetTransactionDescriptionsResponse = {
  __typename?: 'GetTransactionDescriptionsResponse';
  descriptions: Array<Scalars['String']['output']>;
};

/** Data on the home screen */
export type HomePage = {
  __typename?: 'HomePage';
  /** Amount that was over spent */
  overSpending: Scalars['Decimal']['output'];
  /** Settings for the particular month */
  settings: Settings;
  /** Total allocated budget */
  totalBudget: Scalars['Decimal']['output'];
  /** Total $ spend in this month */
  totalSpending: Scalars['Decimal']['output'];
  /** All transactions for this month */
  transactions: Array<Transaction>;
};

export type HomePageV2Input = {
  month: Month;
  year: Scalars['Int']['input'];
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

export type MonthlySettingsResponse = {
  __typename?: 'MonthlySettingsResponse';
  settings: Settings;
};

export type MutationRoot = {
  __typename?: 'MutationRoot';
  /** Add a transaction */
  addTransactionV2: AddTransactionResponseV2;
  /** Delete a transaction by ID from the PostgresDB */
  deleteTransactionByIdV2: DeleteTransactionByIdV2Response;
  /** Save the user subscription to Postgres DB */
  saveSubscriptionV2: SaveSubscriptionV2Response;
  /** Update the settings for a specific month, in the Postgres DB */
  updateMonthSettingsV2: UpdateMonthSettingsResponse;
  /** Update a transaction by ID */
  updateTransactionByIdV2: UpdateTransactionByIdV2Response;
};


export type MutationRootAddTransactionV2Args = {
  inputs: AddTransactionV2Input;
};


export type MutationRootDeleteTransactionByIdV2Args = {
  inputs: DeleteTransactionByIdV2Input;
};


export type MutationRootSaveSubscriptionV2Args = {
  input: SaveSubscriptionV2Input;
};


export type MutationRootUpdateMonthSettingsV2Args = {
  inputs: UpdateMonthSettingsInput;
};


export type MutationRootUpdateTransactionByIdV2Args = {
  inputs: UpdateTransactionByIdV2Input;
};

/** Root of the query */
export type QueryRoot = {
  __typename?: 'QueryRoot';
  /** Configuration for the frontend to consume */
  config: FrontendConfig;
  /** Query information from the Firefly server */
  fireflyV2?: Maybe<FireflyV2SuccessResponse>;
  /** Get a list of recent transaction descriptions, for auto completing transaction descriptions */
  getTransactionDescriptions: GetTransactionDescriptionsResponse;
  /** Get data to display on the home page */
  homePageV2: HomePage;
  /** Returns the content of the JWT */
  meV2: UserV2;
  /**
   * Get the settings for a particular month. Retrieves the data from PostgresDB
   * If there are no settings for the month, check the previous month. If it exists, insert the previous month settings into the month being queried
   */
  monthSettingsV2: MonthlySettingsResponse;
  /** Search for a transaction from the PostgresDB */
  searchTransactionV2: SearchTransactionV2Response;
};


/** Root of the query */
export type QueryRootGetTransactionDescriptionsArgs = {
  inputs: GetTransactionDescriptionsInput;
};


/** Root of the query */
export type QueryRootHomePageV2Args = {
  inputs: HomePageV2Input;
};


/** Root of the query */
export type QueryRootMonthSettingsV2Args = {
  month: Month;
  year: Scalars['Int']['input'];
};


/** Root of the query */
export type QueryRootSearchTransactionV2Args = {
  inputs: SearchTransactionV2Inputs;
};

export type SaveSubscriptionV2Input = {
  auth: Scalars['String']['input'];
  endpoint: Scalars['String']['input'];
  expirationTime?: InputMaybe<Scalars['String']['input']>;
  p256Dh: Scalars['String']['input'];
};

export type SaveSubscriptionV2Response = {
  __typename?: 'SaveSubscriptionV2Response';
  success: Scalars['Boolean']['output'];
};

export type SearchTransactionV2Inputs = {
  /** ID of the transaction to search for */
  transactionId: Scalars['UUID']['input'];
};

export type SearchTransactionV2Response = {
  __typename?: 'SearchTransactionV2Response';
  transaction?: Maybe<Transaction>;
};

/** Data on the settings page */
export type SettingInput = {
  /** Firefly related settings */
  firefly: FireflySettingsV2Input;
  /** Maggie contribution amount. The frontend is responsible for computing this value */
  maggieContributionAmount: Scalars['Decimal']['input'];
  /** Maggie percentage allocation */
  maggiePercentageAllocation: Scalars['Decimal']['input'];
  /** Shawn contribution amount. The frontend is responsible for computing this value */
  shawnContributionAmount: Scalars['Decimal']['input'];
  /** Shawn percentage allocation */
  shawnPercentageAllocation: Scalars['Decimal']['input'];
  /** Total allocated budget */
  totalAllocation: Scalars['Decimal']['input'];
};

/** Data on the settings page */
export type Settings = {
  __typename?: 'Settings';
  /** Firefly related settings */
  firefly: FireflySettingsV2;
  /** Maggie contribution amount. The frontend is responsible for computing this value */
  maggieContributionAmount: Scalars['Decimal']['output'];
  /** Maggie percentage allocation */
  maggiePercentageAllocation: Scalars['Decimal']['output'];
  /** Shawn contribution amount. The frontend is responsible for computing this value */
  shawnContributionAmount: Scalars['Decimal']['output'];
  /** Shawn percentage allocation */
  shawnPercentageAllocation: Scalars['Decimal']['output'];
  /** Total allocated budget */
  totalAllocation: Scalars['Decimal']['output'];
};

/** Represent a single transaction */
export type Transaction = {
  __typename?: 'Transaction';
  amount: Scalars['Decimal']['output'];
  date: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  id: Scalars['UUID']['output'];
  notes: Scalars['String']['output'];
};

/** Represent a single transaction */
export type TransactionInput = {
  amount: Scalars['Decimal']['input'];
  date: Scalars['DateTime']['input'];
  description: Scalars['String']['input'];
  id: Scalars['UUID']['input'];
  notes: Scalars['String']['input'];
};

export type UpdateMonthSettingsInput = {
  /** The month of the budget to update */
  month: Month;
  /** Updated settings */
  settings: SettingInput;
  /** The year of the budget to update */
  year: Scalars['Int']['input'];
};

export type UpdateMonthSettingsResponse = {
  __typename?: 'UpdateMonthSettingsResponse';
  success: Scalars['Boolean']['output'];
};

export type UpdateTransactionByIdV2Input = {
  amount: Scalars['Decimal']['input'];
  date: Scalars['DateTime']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  transactionId: Scalars['UUID']['input'];
};

export type UpdateTransactionByIdV2Response = {
  __typename?: 'UpdateTransactionByIdV2Response';
  success: Scalars['Boolean']['output'];
};

export type UserV2 = {
  __typename?: 'UserV2';
  username: Scalars['String']['output'];
};

export type SaveSubscriptionMutationVariables = Exact<{
  subscription: SaveSubscriptionV2Input;
}>;


export type SaveSubscriptionMutation = { __typename?: 'MutationRoot', saveSubscriptionV2: { __typename?: 'SaveSubscriptionV2Response', success: boolean } };

export type UpdateSettingsMutationVariables = Exact<{
  inputs: UpdateMonthSettingsInput;
}>;


export type UpdateSettingsMutation = { __typename?: 'MutationRoot', updateMonthSettingsV2: { __typename?: 'UpdateMonthSettingsResponse', success: boolean } };

export type DeleteTransactionByIdMutationVariables = Exact<{
  inputs: DeleteTransactionByIdV2Input;
}>;


export type DeleteTransactionByIdMutation = { __typename?: 'MutationRoot', deleteTransactionByIdV2: { __typename?: 'DeleteTransactionByIdV2Response', success: boolean } };

export type AddTransactionV2MutationVariables = Exact<{
  inputs: AddTransactionV2Input;
}>;


export type AddTransactionV2Mutation = { __typename?: 'MutationRoot', addTransactionV2: { __typename?: 'AddTransactionResponseV2', success: boolean } };

export type UpdateTransactionByIdMutationVariables = Exact<{
  inputs: UpdateTransactionByIdV2Input;
}>;


export type UpdateTransactionByIdMutation = { __typename?: 'MutationRoot', updateTransactionByIdV2: { __typename?: 'UpdateTransactionByIdV2Response', success: boolean } };

export type SettingsPageDataV2QueryVariables = Exact<{
  year: Scalars['Int']['input'];
  month: Month;
}>;


export type SettingsPageDataV2Query = { __typename?: 'QueryRoot', monthSettingsV2: { __typename?: 'MonthlySettingsResponse', settings: { __typename?: 'Settings', totalAllocation: Decimal, shawnPercentageAllocation: Decimal, shawnContributionAmount: Decimal, maggiePercentageAllocation: Decimal, maggieContributionAmount: Decimal, firefly: { __typename?: 'FireflySettingsV2', enabled: boolean, apiKey?: string | null, sourceAccount?: string | null } } }, fireflyV2?: { __typename?: 'FireflyV2SuccessResponse', accounts: Array<string> } | null };

export type GetHomePageDataV2QueryVariables = Exact<{
  inputs: HomePageV2Input;
}>;


export type GetHomePageDataV2Query = { __typename?: 'QueryRoot', homePageV2: { __typename?: 'HomePage', totalSpending: Decimal, totalBudget: Decimal, overSpending: Decimal, transactions: Array<{ __typename?: 'Transaction', id: any, amount: Decimal, date: Date, description: string, notes: string }>, settings: { __typename?: 'Settings', totalAllocation: Decimal, shawnPercentageAllocation: Decimal, shawnContributionAmount: Decimal, maggiePercentageAllocation: Decimal, maggieContributionAmount: Decimal } } };

export type SplitBudgetDataQueryVariables = Exact<{
  year: Scalars['Int']['input'];
  month: Month;
}>;


export type SplitBudgetDataQuery = { __typename?: 'QueryRoot', monthSettingsV2: { __typename?: 'MonthlySettingsResponse', settings: { __typename?: 'Settings', totalAllocation: Decimal, shawnPercentageAllocation: Decimal, shawnContributionAmount: Decimal, maggiePercentageAllocation: Decimal, maggieContributionAmount: Decimal } } };

export type GetConfigQueryVariables = Exact<{ [key: string]: never; }>;


export type GetConfigQuery = { __typename?: 'QueryRoot', config: { __typename?: 'FrontendConfig', encryptionPublicKey: string, vapidPublicKey: string } };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { __typename?: 'QueryRoot', meV2: { __typename?: 'UserV2', username: string } };

export type SearchTransactionByIdQueryVariables = Exact<{
  inputs: SearchTransactionV2Inputs;
}>;


export type SearchTransactionByIdQuery = { __typename?: 'QueryRoot', searchTransactionV2: { __typename?: 'SearchTransactionV2Response', transaction?: { __typename?: 'Transaction', id: any, amount: Decimal, date: Date, description: string, notes: string } | null } };

export type GetTransactionDescriptionsQueryVariables = Exact<{
  inputs: GetTransactionDescriptionsInput;
}>;


export type GetTransactionDescriptionsQuery = { __typename?: 'QueryRoot', getTransactionDescriptions: { __typename?: 'GetTransactionDescriptionsResponse', descriptions: Array<string> } };


export const SaveSubscriptionDocument = gql`
    mutation saveSubscription($subscription: SaveSubscriptionV2Input!) {
  saveSubscriptionV2(input: $subscription) {
    success
  }
}
    `;
export const UpdateSettingsDocument = gql`
    mutation UpdateSettings($inputs: UpdateMonthSettingsInput!) {
  updateMonthSettingsV2(inputs: $inputs) {
    success
  }
}
    `;
export const DeleteTransactionByIdDocument = gql`
    mutation DeleteTransactionByID($inputs: DeleteTransactionByIdV2Input!) {
  deleteTransactionByIdV2(inputs: $inputs) {
    success
  }
}
    `;
export const AddTransactionV2Document = gql`
    mutation AddTransactionV2($inputs: AddTransactionV2Input!) {
  addTransactionV2(inputs: $inputs) {
    success
  }
}
    `;
export const UpdateTransactionByIdDocument = gql`
    mutation UpdateTransactionByID($inputs: UpdateTransactionByIdV2Input!) {
  updateTransactionByIdV2(inputs: $inputs) {
    success
  }
}
    `;
export const SettingsPageDataV2Document = gql`
    query SettingsPageDataV2($year: Int!, $month: Month!) {
  monthSettingsV2(year: $year, month: $month) {
    settings {
      totalAllocation
      shawnPercentageAllocation
      shawnContributionAmount
      maggiePercentageAllocation
      maggieContributionAmount
      firefly {
        enabled
        apiKey
        sourceAccount
      }
    }
  }
  fireflyV2 {
    accounts
  }
}
    `;
export const GetHomePageDataV2Document = gql`
    query GetHomePageDataV2($inputs: HomePageV2Input!) {
  homePageV2(inputs: $inputs) {
    totalSpending
    totalBudget
    overSpending
    transactions {
      id
      amount
      date
      description
      notes
    }
    settings {
      totalAllocation
      shawnPercentageAllocation
      shawnContributionAmount
      maggiePercentageAllocation
      maggieContributionAmount
    }
  }
}
    `;
export const SplitBudgetDataDocument = gql`
    query SplitBudgetData($year: Int!, $month: Month!) {
  monthSettingsV2(year: $year, month: $month) {
    settings {
      totalAllocation
      shawnPercentageAllocation
      shawnContributionAmount
      maggiePercentageAllocation
      maggieContributionAmount
    }
  }
}
    `;
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
  meV2 {
    username
  }
}
    `;
export const SearchTransactionByIdDocument = gql`
    query SearchTransactionByID($inputs: SearchTransactionV2Inputs!) {
  searchTransactionV2(inputs: $inputs) {
    transaction {
      id
      amount
      date
      description
      notes
    }
  }
}
    `;
export const GetTransactionDescriptionsDocument = gql`
    query GetTransactionDescriptions($inputs: GetTransactionDescriptionsInput!) {
  getTransactionDescriptions(inputs: $inputs) {
    descriptions
  }
}
    `;

export type SdkFunctionWrapper = <T>(action: (requestHeaders?:Record<string, string>) => Promise<T>, operationName: string, operationType?: string, variables?: any) => Promise<T>;


const defaultWrapper: SdkFunctionWrapper = (action, _operationName, _operationType, _variables) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    saveSubscription(variables: SaveSubscriptionMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<SaveSubscriptionMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<SaveSubscriptionMutation>({ document: SaveSubscriptionDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'saveSubscription', 'mutation', variables);
    },
    UpdateSettings(variables: UpdateSettingsMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpdateSettingsMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateSettingsMutation>({ document: UpdateSettingsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpdateSettings', 'mutation', variables);
    },
    DeleteTransactionByID(variables: DeleteTransactionByIdMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<DeleteTransactionByIdMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<DeleteTransactionByIdMutation>({ document: DeleteTransactionByIdDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'DeleteTransactionByID', 'mutation', variables);
    },
    AddTransactionV2(variables: AddTransactionV2MutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<AddTransactionV2Mutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<AddTransactionV2Mutation>({ document: AddTransactionV2Document, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'AddTransactionV2', 'mutation', variables);
    },
    UpdateTransactionByID(variables: UpdateTransactionByIdMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpdateTransactionByIdMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateTransactionByIdMutation>({ document: UpdateTransactionByIdDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpdateTransactionByID', 'mutation', variables);
    },
    SettingsPageDataV2(variables: SettingsPageDataV2QueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<SettingsPageDataV2Query> {
      return withWrapper((wrappedRequestHeaders) => client.request<SettingsPageDataV2Query>({ document: SettingsPageDataV2Document, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'SettingsPageDataV2', 'query', variables);
    },
    GetHomePageDataV2(variables: GetHomePageDataV2QueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetHomePageDataV2Query> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetHomePageDataV2Query>({ document: GetHomePageDataV2Document, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetHomePageDataV2', 'query', variables);
    },
    SplitBudgetData(variables: SplitBudgetDataQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<SplitBudgetDataQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<SplitBudgetDataQuery>({ document: SplitBudgetDataDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'SplitBudgetData', 'query', variables);
    },
    getConfig(variables?: GetConfigQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetConfigQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetConfigQuery>({ document: GetConfigDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'getConfig', 'query', variables);
    },
    Me(variables?: MeQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<MeQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<MeQuery>({ document: MeDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'Me', 'query', variables);
    },
    SearchTransactionByID(variables: SearchTransactionByIdQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<SearchTransactionByIdQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<SearchTransactionByIdQuery>({ document: SearchTransactionByIdDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'SearchTransactionByID', 'query', variables);
    },
    GetTransactionDescriptions(variables: GetTransactionDescriptionsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetTransactionDescriptionsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetTransactionDescriptionsQuery>({ document: GetTransactionDescriptionsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetTransactionDescriptions', 'query', variables);
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;