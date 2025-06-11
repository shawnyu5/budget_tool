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
  /** A scalar that can represent any JSON value. */
  JSON: { input: any; output: any; }
};

export type Address = {
  __typename?: 'Address';
  addressLine: Scalars['String']['output'];
  city: Scalars['String']['output'];
  country: Country;
  postalCode: Scalars['String']['output'];
};

export type AverageOverallRating = {
  __typename?: 'AverageOverallRating';
  averageCollectionExperienceRating: Scalars['Float']['output'];
  averageContentsVarietyRating: Scalars['Float']['output'];
  averageFoodQualityRating: Scalars['Float']['output'];
  averageFoodQuantityRating: Scalars['Float']['output'];
  averageOverallRating: Scalars['Float']['output'];
  monthCount: Scalars['Int']['output'];
  ratingCount: Scalars['Int']['output'];
};

export type Country = {
  __typename?: 'Country';
  isoCode: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type CoverPicture = {
  __typename?: 'CoverPicture';
  currentUrl: Scalars['String']['output'];
  isAutomaticallyCreated: Scalars['Boolean']['output'];
  pictureId: Scalars['String']['output'];
};

export type Item = {
  __typename?: 'Item';
  averageOverallRating: AverageOverallRating;
  buffet: Scalars['Boolean']['output'];
  canUserSupplyPackaging: Scalars['Boolean']['output'];
  collectionInfo: Scalars['String']['output'];
  coverPicture: CoverPicture;
  description: Scalars['String']['output'];
  dietCategories: Array<Scalars['JSON']['output']>;
  favoriteCount: Scalars['Int']['output'];
  foodHandlingInstructions: Scalars['String']['output'];
  itemCategory: Scalars['String']['output'];
  itemId: Scalars['String']['output'];
  itemPrice: ItemPrice;
  itemValue: ItemValue;
  logoPicture: LogoPicture;
  name: Scalars['String']['output'];
  packagingOption: Scalars['String']['output'];
  positiveRatingReasons: Array<Scalars['String']['output']>;
  priceExcludingTaxes: PriceExcludingTaxes;
  priceIncludingTaxes: PriceIncludingTaxes;
  salesTaxes: Array<SalesTax>;
  showSalesTaxes: Scalars['Boolean']['output'];
  subtitle: Scalars['String']['output'];
  taxAmount: TaxAmount;
  taxationPolicy: Scalars['String']['output'];
  valueExcludingTaxes: ValueExcludingTaxes;
  valueIncludingTaxes: ValueIncludingTaxes;
};

export type ItemPrice = {
  __typename?: 'ItemPrice';
  code: Scalars['String']['output'];
  decimals: Scalars['Int']['output'];
  minorUnits: Scalars['Int']['output'];
};

export type ItemTag = {
  __typename?: 'ItemTag';
  description?: Maybe<Scalars['String']['output']>;
  descriptionHeading?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  longText?: Maybe<Scalars['String']['output']>;
  shortText: Scalars['String']['output'];
  variant: Scalars['String']['output'];
};

export type ItemValue = {
  __typename?: 'ItemValue';
  code: Scalars['String']['output'];
  decimals: Scalars['Int']['output'];
  minorUnits: Scalars['Int']['output'];
};

export type Items = {
  __typename?: 'Items';
  displayName: Scalars['String']['output'];
  distance: Scalars['Float']['output'];
  favorite: Scalars['Boolean']['output'];
  inSalesWindow: Scalars['Boolean']['output'];
  item: Item;
  itemTags: Array<ItemTag>;
  itemType: Scalars['String']['output'];
  itemsAvailable: Scalars['Int']['output'];
  matchesFilters: Scalars['Boolean']['output'];
  newItem: Scalars['Boolean']['output'];
  pickupInterval: PickupInterval;
  pickupLocation: PickupLocation;
  purchaseEnd: Scalars['String']['output'];
  store: Store;
  subscribedToNotification: Scalars['Boolean']['output'];
};

export type Location = {
  __typename?: 'Location';
  latitude: Scalars['Float']['output'];
  longitude: Scalars['Float']['output'];
};

export type LogoPicture = {
  __typename?: 'LogoPicture';
  currentUrl: Scalars['String']['output'];
  isAutomaticallyCreated: Scalars['Boolean']['output'];
  pictureId: Scalars['String']['output'];
};

export type PickupInterval = {
  __typename?: 'PickupInterval';
  end: Scalars['String']['output'];
  start: Scalars['String']['output'];
};

export type PickupLocation = {
  __typename?: 'PickupLocation';
  address: Address;
  location: Location;
};

export type PriceExcludingTaxes = {
  __typename?: 'PriceExcludingTaxes';
  code: Scalars['String']['output'];
  decimals: Scalars['Int']['output'];
  minorUnits: Scalars['Int']['output'];
};

export type PriceIncludingTaxes = {
  __typename?: 'PriceIncludingTaxes';
  code: Scalars['String']['output'];
  decimals: Scalars['Int']['output'];
  minorUnits: Scalars['Int']['output'];
};

/** Root of the query */
export type QueryRoot = {
  __typename?: 'QueryRoot';
  /** Tgtg related queries */
  tgtg: Tgtg;
};

export type SalesTax = {
  __typename?: 'SalesTax';
  taxDescription: Scalars['String']['output'];
  taxPercentage: Scalars['Float']['output'];
};

export type Store = {
  __typename?: 'Store';
  branch: Scalars['String']['output'];
  coverPicture: CoverPicture;
  description: Scalars['String']['output'];
  distance: Scalars['Float']['output'];
  favoriteCount: Scalars['Int']['output'];
  hidden: Scalars['Boolean']['output'];
  isManufacturer: Scalars['Boolean']['output'];
  logoPicture: LogoPicture;
  storeId: Scalars['String']['output'];
  storeLocation: StoreLocation;
  storeName: Scalars['String']['output'];
  storeTimeZone: Scalars['String']['output'];
  taxIdentifier: Scalars['String']['output'];
  website: Scalars['String']['output'];
};

export type StoreLocation = {
  __typename?: 'StoreLocation';
  address: Address;
  location: Location;
};

export type TaxAmount = {
  __typename?: 'TaxAmount';
  code: Scalars['String']['output'];
  decimals: Scalars['Int']['output'];
  minorUnits: Scalars['Int']['output'];
};

/** Tgtg related queries */
export type Tgtg = {
  __typename?: 'Tgtg';
  /** Get tgtg items */
  items: Items;
};

export type ValueExcludingTaxes = {
  __typename?: 'ValueExcludingTaxes';
  code: Scalars['String']['output'];
  decimals: Scalars['Int']['output'];
  minorUnits: Scalars['Int']['output'];
};

export type ValueIncludingTaxes = {
  __typename?: 'ValueIncludingTaxes';
  code: Scalars['String']['output'];
  decimals: Scalars['Int']['output'];
  minorUnits: Scalars['Int']['output'];
};

export type GetItemsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetItemsQuery = { __typename?: 'QueryRoot', tgtg: { __typename?: 'Tgtg', items: { __typename?: 'Items', displayName: string, itemsAvailable: number, distance: number, item: { __typename?: 'Item', name: string, description: string, itemCategory: string, itemPrice: { __typename?: 'ItemPrice', code: string, minorUnits: number, decimals: number }, coverPicture: { __typename?: 'CoverPicture', currentUrl: string } }, store: { __typename?: 'Store', storeName: string, distance: number, storeLocation: { __typename?: 'StoreLocation', address: { __typename?: 'Address', city: string, postalCode: string, country: { __typename?: 'Country', name: string } }, location: { __typename?: 'Location', latitude: number, longitude: number } } } } } };


export const GetItemsDocument = gql`
    query getItems {
  tgtg {
    items {
      displayName
      itemsAvailable
      distance
      item {
        name
        description
        itemCategory
        itemPrice {
          code
          minorUnits
          decimals
        }
        coverPicture {
          currentUrl
        }
      }
      store {
        storeName
        distance
        storeLocation {
          address {
            country {
              name
            }
            city
            postalCode
          }
          location {
            latitude
            longitude
          }
        }
      }
    }
  }
}
    `;

export type SdkFunctionWrapper = <T>(action: (requestHeaders?:Record<string, string>) => Promise<T>, operationName: string, operationType?: string, variables?: any) => Promise<T>;


const defaultWrapper: SdkFunctionWrapper = (action, _operationName, _operationType, _variables) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    getItems(variables?: GetItemsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetItemsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetItemsQuery>({ document: GetItemsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'getItems', 'query', variables);
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;