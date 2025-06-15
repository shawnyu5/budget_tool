/**
 * Wrapper to generate a graphql client with defaults
 */

import { GraphQLClient } from "graphql-request";
import { loadLocalConfig } from "./config";
import { getLocalAuthToken } from "./utils";
import { getSdk } from "./generated/graphql";

/**
 * Construct a new GraphQL SDK that is ready to use
 * @returns a graphQL SDK
 */
export function NewGraphQLSDK() {
  const client = new GraphQLClient(`${loadLocalConfig().backendUrl}/graphql`, {
    headers: {
      Authorization: `Bearer ${getLocalAuthToken()}`,
    },
  });

  return getSdk(client);
}
