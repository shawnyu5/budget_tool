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

export type Budget = {
  __typename?: 'Budget';
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

export type Circle = {
  __typename?: 'Circle';
  area: Scalars['Float']['output'];
  scale: Shape;
};


export type CircleScaleArgs = {
  s: Scalars['Float']['input'];
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
  /** When the user does not have the authorization */
  Forbidden = 'FORBIDDEN',
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
  budget: Budget;
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

export type MonthlyBudgetResponse = GraphQlErrorObject | MonthlyBudget;

export type MutationRoot = {
  __typename?: 'MutationRoot';
  /**
   * Save a notification subscription for a user
   * The user is extracted from the JWT
   */
  saveSubscription: User;
};


export type MutationRootSaveSubscriptionArgs = {
  subscription: SubscriptionInput;
};

export type NotificationKeys = {
  __typename?: 'NotificationKeys';
  auth: Scalars['String']['output'];
  p256Dh: Scalars['String']['output'];
};

/** Stuff the browser sends to do the notification handshake */
export type NotificationSubscription = {
  __typename?: 'NotificationSubscription';
  endpoint: Scalars['String']['output'];
  expirationTime?: Maybe<Scalars['Int']['output']>;
  keys: NotificationKeys;
};

/** Root of the query */
export type QueryRoot = {
  __typename?: 'QueryRoot';
  /** Configuration for the frontend to consume */
  config: FrontendConfig;
  /**
   * Get the budget for a specific month in a year
   *
   * * `year`: the year
   * * `month`: the month
   */
  monthlyBudget: MonthlyBudgetResponse;
  shape: Shape;
};


/** Root of the query */
export type QueryRootMonthlyBudgetArgs = {
  month: Month;
  year: Scalars['Int']['input'];
};

export type Shape = Circle | Square;

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

export type Square = {
  __typename?: 'Square';
  area: Scalars['Float']['output'];
  scale: Shape;
};


export type SquareScaleArgs = {
  s: Scalars['Float']['input'];
};

export type SubscriptionInput = {
  auth: Scalars['String']['input'];
  endpoint: Scalars['String']['input'];
  expirationTime?: InputMaybe<Scalars['Int']['input']>;
  p256Dh: Scalars['String']['input'];
};

/** Represents a user */
export type User = {
  __typename?: 'User';
  lastUpdated?: Maybe<Scalars['String']['output']>;
  /** Notification subscription */
  notificationSubscription: NotificationSubscription;
  /** Username of the user */
  username: Scalars['String']['output'];
};

export type SaveSubscriptionMutationVariables = Exact<{
  subscription: SubscriptionInput;
}>;


export type SaveSubscriptionMutation = { __typename?: 'MutationRoot', saveSubscription: { __typename?: 'User', username: string, notificationSubscription: { __typename?: 'NotificationSubscription', endpoint: string, expirationTime?: number | null, keys: { __typename?: 'NotificationKeys', p256Dh: string, auth: string } } } };

export type GetMonthlyBudgetConfigQueryVariables = Exact<{
  year: Scalars['Int']['input'];
  month: Month;
}>;


export type GetMonthlyBudgetConfigQuery = { __typename?: 'QueryRoot', monthlyBudget: { __typename?: 'GraphQLErrorObject', code: GraphQlErrorCode, message: string } | { __typename?: 'MonthlyBudget', budget: { __typename?: 'Budget', totalAllocation: number, shawnPercentageAllocation: number, shawnContributionAmount: number, maggiePercentageAllocation: number, maggieContributionAmount: number } } };

export type GetMonthBudgetQueryVariables = Exact<{
  year: Scalars['Int']['input'];
  month: Month;
}>;


export type GetMonthBudgetQuery = { __typename?: 'QueryRoot', monthlyBudget: { __typename: 'GraphQLErrorObject', code: GraphQlErrorCode, message: string } | { __typename: 'MonthlyBudget', month: Month, totalSpending: number, overBudgetAmount: number, carriedOverFrom?: Month | null, spending: Array<{ __typename?: 'SpendingItem', id: string, amount: number, date: string, description: string, notes?: string | null }>, budget: { __typename?: 'Budget', totalAllocation: number, maggiePercentageAllocation: number, maggieContributionAmount: number, shawnPercentageAllocation: number, shawnContributionAmount: number } } };

export type GetConfigQueryVariables = Exact<{ [key: string]: never; }>;


export type GetConfigQuery = { __typename?: 'QueryRoot', config: { __typename?: 'FrontendConfig', encryptionPublicKey: string, vapidPublicKey: string } };


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
export const GetMonthlyBudgetConfigDocument = gql`
    query GetMonthlyBudgetConfig($year: Int!, $month: Month!) {
  monthlyBudget(year: $year, month: $month) {
    ... on MonthlyBudget {
      budget {
        totalAllocation
        shawnPercentageAllocation
        shawnContributionAmount
        maggiePercentageAllocation
        maggieContributionAmount
      }
    }
    ... on GraphQLErrorObject {
      code
      message
    }
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
    ... on GraphQLErrorObject {
      __typename
      code
      message
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

export type SdkFunctionWrapper = <T>(action: (requestHeaders?:Record<string, string>) => Promise<T>, operationName: string, operationType?: string, variables?: any) => Promise<T>;


const defaultWrapper: SdkFunctionWrapper = (action, _operationName, _operationType, _variables) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    saveSubscription(variables: SaveSubscriptionMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<SaveSubscriptionMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<SaveSubscriptionMutation>({ document: SaveSubscriptionDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'saveSubscription', 'mutation', variables);
    },
    GetMonthlyBudgetConfig(variables: GetMonthlyBudgetConfigQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetMonthlyBudgetConfigQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetMonthlyBudgetConfigQuery>({ document: GetMonthlyBudgetConfigDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetMonthlyBudgetConfig', 'query', variables);
    },
    GetMonthBudget(variables: GetMonthBudgetQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetMonthBudgetQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetMonthBudgetQuery>({ document: GetMonthBudgetDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetMonthBudget', 'query', variables);
    },
    getConfig(variables?: GetConfigQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetConfigQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetConfigQuery>({ document: GetConfigDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'getConfig', 'query', variables);
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;