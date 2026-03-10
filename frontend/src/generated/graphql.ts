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

/** Errors that could happen during adding an item by month */
export enum AddSpendingItemByMonthError {
  /** Failed to create / update transactions in firefly */
  FireflyUpdateFailed = 'FIREFLY_UPDATE_FAILED'
}

export type AddSpendingItemByMonthErrorObject = {
  __typename?: 'AddSpendingItemByMonthErrorObject';
  code: AddSpendingItemByMonthError;
  message: Scalars['String']['output'];
};

export type AddSpendingItemByMonthInput = {
  month: Month;
  spendingItem: SpendingItemInput;
  year: Scalars['String']['input'];
};

export type AddSpendingItemByMonthResponse = AddSpendingItemByMonthErrorObject | SuccessResponse;

export type AddTransactionResponseV2 = {
  __typename?: 'AddTransactionResponseV2';
  success: Scalars['Boolean']['output'];
};

export type AddTransactionV2Input = {
  month: Month;
  transaction: TransactionInput;
  year: Scalars['Int']['input'];
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

export type DeleteTransactionByIdV2Input = {
  transactionId: Scalars['UUID']['input'];
};

export type DeleteTransactionByIdV2Response = {
  __typename?: 'DeleteTransactionByIdV2Response';
  success: Scalars['Boolean']['output'];
};

/** Firefly related settings */
export type FireflySettings = {
  __typename?: 'FireflySettings';
  /**
   * Encrypted firefly API key, required if `enabled` = true
   * Must call `User.decrypt_firefly_api_key()` to get the decrypted version
   */
  apiKey?: Maybe<Scalars['String']['output']>;
  /** If the user has enabled Firefly integration */
  enabled: Scalars['Boolean']['output'];
  /** Base64 encoded nounce used to encrypt / decrypt the API key */
  encryptionNounce?: Maybe<Scalars['String']['output']>;
  /** The source account to create the transaction in */
  sourceAccount?: Maybe<Scalars['String']['output']>;
};

/** Firefly related settings */
export type FireflySettingsInput = {
  /**
   * Encrypted firefly API key, required if `enabled` = true
   * Must call `User.decrypt_firefly_api_key()` to get the decrypted version
   */
  apiKey?: InputMaybe<Scalars['String']['input']>;
  /** If the user has enabled Firefly integration */
  enabled: Scalars['Boolean']['input'];
  /** Base64 encoded nounce used to encrypt / decrypt the API key */
  encryptionNounce?: InputMaybe<Scalars['String']['input']>;
  /** The source account to create the transaction in */
  sourceAccount?: InputMaybe<Scalars['String']['input']>;
};

/** Firefly related settings */
export type FireflySettingsV2 = {
  __typename?: 'FireflySettingsV2';
  /**
   * Encrypted firefly API key, required if `enabled` = true
   * Must call `User.decrypt_firefly_api_key()` to get the decrypted version
   */
  apiKey?: Maybe<Scalars['String']['output']>;
  /** If the user has enabled Firefly integration */
  enabled: Scalars['Boolean']['output'];
  /** The source account to create the transaction in */
  sourceAccount?: Maybe<Scalars['String']['output']>;
};

/** Firefly related settings */
export type FireflySettingsV2Input = {
  /**
   * Encrypted firefly API key, required if `enabled` = true
   * Must call `User.decrypt_firefly_api_key()` to get the decrypted version
   */
  apiKey?: InputMaybe<Scalars['String']['input']>;
  /** If the user has enabled Firefly integration */
  enabled: Scalars['Boolean']['input'];
  /** The source account to create the transaction in */
  sourceAccount?: InputMaybe<Scalars['String']['input']>;
};

export type FireflySuccessResponse = {
  __typename?: 'FireflySuccessResponse';
  /** List of accounts this user has */
  accounts?: Maybe<Array<Scalars['String']['output']>>;
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
  /** Failed to create / update transactions in firefly */
  FireflyUpdateFailed = 'FIREFLY_UPDATE_FAILED',
  InvalidFireflyApiKey = 'INVALID_FIREFLY_API_KEY',
  /** Something went wrong on the server side. Typically response 500 */
  ServerError = 'SERVER_ERROR'
}

export type GraphQlErrorObject = {
  __typename?: 'GraphQLErrorObject';
  code: GraphQlErrorCode;
  message: Scalars['String']['output'];
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

export type MonthlySettingsResponse = {
  __typename?: 'MonthlySettingsResponse';
  settings: Settings;
};

export type MutationRoot = {
  __typename?: 'MutationRoot';
  /**
   * Add a spending item to a month
   * @deprecated use `add_transaction_v2` to save to the PostgresDB
   */
  addSpendingItemByMonth: AddSpendingItemByMonthResponse;
  /** Add a transaction */
  addTransactionV2: AddTransactionResponseV2;
  /**
   * Delete a spending item by ID. If the item doesnt exist, this handler will not do anything
   * @deprecated use `delete_transaction_by_id_v2` to delete from the PostgresDB
   */
  deleteSpendingItemById: MonthlyBudgetResponse;
  /** Delete a transaction by ID from the PostgresDB */
  deleteTransactionByIdV2: DeleteTransactionByIdV2Response;
  me: UpdateMeResponse;
  /**
   * Save a notification subscription for a user
   * The user is extracted from the JWT
   * @deprecated Save to the PostgresDB instead
   */
  saveSubscription: User;
  /** Update the settings for a specific month, in the Postgres DB */
  updateMonthSettingsV2: UpdateMonthSettingsResponse;
  /**
   * Update the budget for a specific month
   * @deprecated Do not use this handler anymore. Prefer the more finegrained updates instead
   */
  updateMonthlyBudget: MonthlyBudgetResponse;
  /**
   * Update the budget configuration for a specific month
   * @deprecated use `update_month_settings_v2` to save to the PostgresDB
   */
  updateMonthlyBudgetConfig: UpdateBudgetConfigResponse;
  /** Update a spending item by ID */
  updateSpendingItemById: UpdateSpendingItemByIdResponse;
  /** Update a transaction by ID */
  updateTransactionByIdV2: UpdateTransactionByIdV2Response;
};


export type MutationRootAddSpendingItemByMonthArgs = {
  inputs: AddSpendingItemByMonthInput;
};


export type MutationRootAddTransactionV2Args = {
  inputs: AddTransactionV2Input;
};


export type MutationRootDeleteSpendingItemByIdArgs = {
  inputs: DeleteSpendingItemByIdInput;
};


export type MutationRootDeleteTransactionByIdV2Args = {
  inputs: DeleteTransactionByIdV2Input;
};


export type MutationRootMeArgs = {
  inputs: UpdateMe;
};


export type MutationRootSaveSubscriptionArgs = {
  subscription: SubscriptionInput;
};


export type MutationRootUpdateMonthSettingsV2Args = {
  inputs: UpdateMonthSettingsInput;
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


export type MutationRootUpdateTransactionByIdV2Args = {
  inputs: UpdateTransactionByIdV2Input;
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
  /** Retrieve information from Firefly it self */
  firefly: FireflySuccessResponse;
  /** Get data to display on the home page */
  homePageV2: HomePage;
  me: User;
  /** Get the settings for a particular month. Retrieves the data from PostgresDB */
  monthSettingsV2: MonthlySettingsResponse;
  /**
   * Get the budget for a specific month in a year
   *
   * * `year`: the year
   * * `month`: the month
   */
  monthlyBudget: MonthlyBudgetResponse;
  monthlyBudgetConfig: MonthlyBudgetConfigResponse;
  /** Search for a spending item by time and ID */
  searchSpendingItem?: Maybe<SpendingItem>;
  /** Search for a transaction from the PostgresDB */
  searchTransactionV2: SearchTransactionV2Response;
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
export type QueryRootMonthlyBudgetArgs = {
  month: Month;
  year: Scalars['Int']['input'];
};


/** Root of the query */
export type QueryRootMonthlyBudgetConfigArgs = {
  month: Month;
  year: Scalars['Int']['input'];
};


/** Root of the query */
export type QueryRootSearchSpendingItemArgs = {
  inputs: SearchSpendingItemInput;
};


/** Root of the query */
export type QueryRootSearchTransactionV2Args = {
  inputs: SearchTransactionV2Inputs;
};

export type SearchSpendingItemInput = {
  id: Scalars['String']['input'];
  month: Month;
  year: Scalars['Int']['input'];
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

/** A single transaction */
export type SpendingItem = {
  __typename?: 'SpendingItem';
  /** The dollar amount */
  amount: Scalars['Float']['output'];
  /** The date */
  date: Scalars['String']['output'];
  /** Date in RFC3339 format, in Eastern timezone */
  dateRfc3339?: Maybe<Scalars['String']['output']>;
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
  /** Date in RFC3339 format, in Eastern timezone */
  dateRfc3339?: InputMaybe<Scalars['String']['input']>;
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

export type SuccessResponse = {
  __typename?: 'SuccessResponse';
  success: Scalars['Boolean']['output'];
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

export type UpdateSpendingItemByIdResponse = {
  __typename?: 'UpdateSpendingItemByIdResponse';
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

export type UpdateSettingsMutationVariables = Exact<{
  inputs: UpdateMonthSettingsInput;
}>;


export type UpdateSettingsMutation = { __typename?: 'MutationRoot', updateMonthSettingsV2: { __typename?: 'UpdateMonthSettingsResponse', success: boolean } };

export type UpdateMonthlyBudgetMutationVariables = Exact<{
  inputs: UpdateMonthlyBudgetInput;
}>;


export type UpdateMonthlyBudgetMutation = { __typename?: 'MutationRoot', updateMonthlyBudget: { __typename: 'GraphQLErrorObject', code: GraphQlErrorCode, message: string } | { __typename: 'MonthlyBudget', month: Month, totalSpending: number, overBudgetAmount: number, carriedOverFrom?: Month | null, spending: Array<{ __typename?: 'SpendingItem', id: string, amount: number, date: string, description: string, notes?: string | null }>, budget: { __typename?: 'BudgetConfig', totalAllocation: number, maggiePercentageAllocation: number, maggieContributionAmount: number, shawnPercentageAllocation: number, shawnContributionAmount: number } } };

export type DeleteTransactionByIdMutationVariables = Exact<{
  inputs: DeleteTransactionByIdV2Input;
}>;


export type DeleteTransactionByIdMutation = { __typename?: 'MutationRoot', deleteTransactionByIdV2: { __typename?: 'DeleteTransactionByIdV2Response', success: boolean } };

export type AddSpendingItemByMonthMutationVariables = Exact<{
  inputs: AddSpendingItemByMonthInput;
}>;


export type AddSpendingItemByMonthMutation = { __typename?: 'MutationRoot', addSpendingItemByMonth: { __typename: 'AddSpendingItemByMonthErrorObject', code: AddSpendingItemByMonthError, message: string } | { __typename: 'SuccessResponse', success: boolean } };

export type AddTransactionV2MutationVariables = Exact<{
  inputs: AddTransactionV2Input;
}>;


export type AddTransactionV2Mutation = { __typename?: 'MutationRoot', addTransactionV2: { __typename?: 'AddTransactionResponseV2', success: boolean } };

export type UpdateSpendingItemByIdMutationVariables = Exact<{
  inputs: UpdateSpendingItemByIdInput;
}>;


export type UpdateSpendingItemByIdMutation = { __typename?: 'MutationRoot', updateSpendingItemById: { __typename?: 'UpdateSpendingItemByIdResponse', success: boolean } };

export type UpdateTransactionByIdMutationVariables = Exact<{
  inputs: UpdateTransactionByIdV2Input;
}>;


export type UpdateTransactionByIdMutation = { __typename?: 'MutationRoot', updateTransactionByIdV2: { __typename?: 'UpdateTransactionByIdV2Response', success: boolean } };

export type GraphQlErrorFieldsFragment = { __typename: 'GraphQLErrorObject', code: GraphQlErrorCode, message: string };

export type GraphQlErrorFieldsV2Fragment = { __typename: 'GraphQLErrorObject', code: GraphQlErrorCode, message: string };

export type SettingsPageDataQueryVariables = Exact<{
  year: Scalars['Int']['input'];
  month: Month;
}>;


export type SettingsPageDataQuery = { __typename?: 'QueryRoot', monthlyBudgetConfig: { __typename: 'BudgetConfig', totalAllocation: number, shawnPercentageAllocation: number, shawnContributionAmount: number, maggiePercentageAllocation: number, maggieContributionAmount: number } | { __typename: 'GraphQLErrorObject', code: GraphQlErrorCode, message: string }, me: { __typename?: 'User', username: string, firefly?: { __typename?: 'FireflySettings', enabled: boolean, apiKey?: string | null, sourceAccount?: string | null } | null }, firefly: { __typename?: 'FireflySuccessResponse', accounts?: Array<string> | null } };

export type SettingsPageDataV2QueryVariables = Exact<{
  year: Scalars['Int']['input'];
  month: Month;
}>;


export type SettingsPageDataV2Query = { __typename?: 'QueryRoot', monthSettingsV2: { __typename?: 'MonthlySettingsResponse', settings: { __typename?: 'Settings', totalAllocation: Decimal, shawnPercentageAllocation: Decimal, shawnContributionAmount: Decimal, maggiePercentageAllocation: Decimal, maggieContributionAmount: Decimal, firefly: { __typename?: 'FireflySettingsV2', enabled: boolean, apiKey?: string | null, sourceAccount?: string | null } } }, firefly: { __typename?: 'FireflySuccessResponse', accounts?: Array<string> | null } };

export type GetMonthBudgetQueryVariables = Exact<{
  year: Scalars['Int']['input'];
  month: Month;
}>;


export type GetMonthBudgetQuery = { __typename?: 'QueryRoot', monthlyBudget: { __typename: 'GraphQLErrorObject', code: GraphQlErrorCode, message: string } | { __typename: 'MonthlyBudget', month: Month, totalSpending: number, overBudgetAmount: number, carriedOverFrom?: Month | null, spending: Array<{ __typename?: 'SpendingItem', id: string, amount: number, date: string, description: string, notes?: string | null }>, budget: { __typename?: 'BudgetConfig', totalAllocation: number, maggiePercentageAllocation: number, maggieContributionAmount: number, shawnPercentageAllocation: number, shawnContributionAmount: number } } };

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


export type MeQuery = { __typename?: 'QueryRoot', me: { __typename?: 'User', username: string } };

export type SpendingItemFormQueryVariables = Exact<{
  year: Scalars['Int']['input'];
  month: Month;
}>;


export type SpendingItemFormQuery = { __typename?: 'QueryRoot', monthlyBudgetConfig: { __typename?: 'BudgetConfig', totalAllocation: number, shawnPercentageAllocation: number, shawnContributionAmount: number, maggiePercentageAllocation: number, maggieContributionAmount: number } | { __typename: 'GraphQLErrorObject', code: GraphQlErrorCode, message: string } };

export type SearchSpendingItemQueryVariables = Exact<{
  inputs: SearchSpendingItemInput;
}>;


export type SearchSpendingItemQuery = { __typename?: 'QueryRoot', searchSpendingItem?: { __typename?: 'SpendingItem', id: string, amount: number, date: string, dateRfc3339?: string | null, description: string, notes?: string | null } | null };

export type SearchTransactionByIdQueryVariables = Exact<{
  inputs: SearchTransactionV2Inputs;
}>;


export type SearchTransactionByIdQuery = { __typename?: 'QueryRoot', searchTransactionV2: { __typename?: 'SearchTransactionV2Response', transaction?: { __typename?: 'Transaction', id: any, amount: Decimal, date: Date, description: string, notes: string } | null } };

export const GraphQlErrorFieldsFragmentDoc = gql`
    fragment GraphQLErrorFields on GraphQLErrorObject {
  __typename
  code
  message
}
    `;
export const GraphQlErrorFieldsV2FragmentDoc = gql`
    fragment GraphQLErrorFieldsV2 on GraphQLErrorObject {
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
export const UpdateSettingsDocument = gql`
    mutation UpdateSettings($inputs: UpdateMonthSettingsInput!) {
  updateMonthSettingsV2(inputs: $inputs) {
    success
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
export const DeleteTransactionByIdDocument = gql`
    mutation DeleteTransactionByID($inputs: DeleteTransactionByIdV2Input!) {
  deleteTransactionByIdV2(inputs: $inputs) {
    success
  }
}
    `;
export const AddSpendingItemByMonthDocument = gql`
    mutation AddSpendingItemByMonth($inputs: AddSpendingItemByMonthInput!) {
  addSpendingItemByMonth(inputs: $inputs) {
    ... on SuccessResponse {
      __typename
      success
    }
    ... on AddSpendingItemByMonthErrorObject {
      __typename
      code
      message
    }
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
export const UpdateSpendingItemByIdDocument = gql`
    mutation UpdateSpendingItemByID($inputs: UpdateSpendingItemByIdInput!) {
  updateSpendingItemById(inputs: $inputs) {
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
      sourceAccount
    }
  }
  firefly {
    accounts
  }
}
    ${GraphQlErrorFieldsFragmentDoc}`;
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
  firefly {
    accounts
  }
}
    `;
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
export const SearchSpendingItemDocument = gql`
    query SearchSpendingItem($inputs: SearchSpendingItemInput!) {
  searchSpendingItem(inputs: $inputs) {
    id
    amount
    date
    dateRfc3339
    description
    notes
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
    UpdateSettings(variables: UpdateSettingsMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpdateSettingsMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateSettingsMutation>({ document: UpdateSettingsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpdateSettings', 'mutation', variables);
    },
    UpdateMonthlyBudget(variables: UpdateMonthlyBudgetMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpdateMonthlyBudgetMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateMonthlyBudgetMutation>({ document: UpdateMonthlyBudgetDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpdateMonthlyBudget', 'mutation', variables);
    },
    DeleteTransactionByID(variables: DeleteTransactionByIdMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<DeleteTransactionByIdMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<DeleteTransactionByIdMutation>({ document: DeleteTransactionByIdDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'DeleteTransactionByID', 'mutation', variables);
    },
    AddSpendingItemByMonth(variables: AddSpendingItemByMonthMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<AddSpendingItemByMonthMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<AddSpendingItemByMonthMutation>({ document: AddSpendingItemByMonthDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'AddSpendingItemByMonth', 'mutation', variables);
    },
    AddTransactionV2(variables: AddTransactionV2MutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<AddTransactionV2Mutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<AddTransactionV2Mutation>({ document: AddTransactionV2Document, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'AddTransactionV2', 'mutation', variables);
    },
    UpdateSpendingItemByID(variables: UpdateSpendingItemByIdMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpdateSpendingItemByIdMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateSpendingItemByIdMutation>({ document: UpdateSpendingItemByIdDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpdateSpendingItemByID', 'mutation', variables);
    },
    UpdateTransactionByID(variables: UpdateTransactionByIdMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpdateTransactionByIdMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateTransactionByIdMutation>({ document: UpdateTransactionByIdDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpdateTransactionByID', 'mutation', variables);
    },
    SettingsPageData(variables: SettingsPageDataQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<SettingsPageDataQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<SettingsPageDataQuery>({ document: SettingsPageDataDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'SettingsPageData', 'query', variables);
    },
    SettingsPageDataV2(variables: SettingsPageDataV2QueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<SettingsPageDataV2Query> {
      return withWrapper((wrappedRequestHeaders) => client.request<SettingsPageDataV2Query>({ document: SettingsPageDataV2Document, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'SettingsPageDataV2', 'query', variables);
    },
    GetMonthBudget(variables: GetMonthBudgetQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetMonthBudgetQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetMonthBudgetQuery>({ document: GetMonthBudgetDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetMonthBudget', 'query', variables);
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
    SpendingItemForm(variables: SpendingItemFormQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<SpendingItemFormQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<SpendingItemFormQuery>({ document: SpendingItemFormDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'SpendingItemForm', 'query', variables);
    },
    SearchSpendingItem(variables: SearchSpendingItemQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<SearchSpendingItemQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<SearchSpendingItemQuery>({ document: SearchSpendingItemDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'SearchSpendingItem', 'query', variables);
    },
    SearchTransactionByID(variables: SearchTransactionByIdQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<SearchTransactionByIdQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<SearchTransactionByIdQuery>({ document: SearchTransactionByIdDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'SearchTransactionByID', 'query', variables);
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;