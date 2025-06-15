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

/** Frontend configuration */
export type FrontendConfig = {
  __typename?: 'FrontendConfig';
  /** Base 64 encoded public key used for encryption */
  encryptionPublicKey: Scalars['String']['output'];
  /** Non base 64 encoded VAPID public key used for sending notifications */
  vapidPublicKey: Scalars['String']['output'];
};

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
  /** Notification subscription */
  notificationSubscription: NotificationSubscription;
  /** Username of the user */
  username: Scalars['String']['output'];
};

export type GetConfigQueryVariables = Exact<{ [key: string]: never; }>;


export type GetConfigQuery = { __typename?: 'QueryRoot', config: { __typename?: 'FrontendConfig', encryptionPublicKey: string, vapidPublicKey: string } };

export type SaveSubscriptionMutationVariables = Exact<{
  subscription: SubscriptionInput;
}>;


export type SaveSubscriptionMutation = { __typename?: 'MutationRoot', saveSubscription: { __typename?: 'User', username: string } };


export const GetConfigDocument = gql`
    query getConfig {
  config {
    encryptionPublicKey
    vapidPublicKey
  }
}
    `;
export const SaveSubscriptionDocument = gql`
    mutation saveSubscription($subscription: SubscriptionInput!) {
  saveSubscription(subscription: $subscription) {
    username
  }
}
    `;

export type SdkFunctionWrapper = <T>(action: (requestHeaders?:Record<string, string>) => Promise<T>, operationName: string, operationType?: string, variables?: any) => Promise<T>;


const defaultWrapper: SdkFunctionWrapper = (action, _operationName, _operationType, _variables) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    getConfig(variables?: GetConfigQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetConfigQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetConfigQuery>({ document: GetConfigDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'getConfig', 'query', variables);
    },
    saveSubscription(variables: SaveSubscriptionMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<SaveSubscriptionMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<SaveSubscriptionMutation>({ document: SaveSubscriptionDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'saveSubscription', 'mutation', variables);
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;