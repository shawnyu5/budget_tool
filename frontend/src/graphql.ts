/**
 * Wrapper to generate a graphql client with defaults
 */

import { GraphQLClient } from "graphql-request";
import { Navigator } from "@solidjs/router";
import { loadLocalConfig } from "./config";
import { getLocalAuthToken } from "./utils";
import { GetMonthBudgetQuery, getSdk, GraphQlErrorCode } from "./generated/graphql";

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

/**
 * Handles errors from fetching budget, and performs redirection based on error response
 * @param res - the full graphQL response body
 * @param navigate - Navigator used to perform navigation
 * @returns error message if any
 */
export function handleGetMonthlyBudgetError(
  res: GetMonthBudgetQuery,
  navigate: Navigator,
): string | null {
  if (res.monthlyBudget.__typename == "GraphQLErrorObject") {
    const e = res.monthlyBudget.code;
    if (e == GraphQlErrorCode.Forbidden) {
      navigate("/login", { replace: true });
    } else if (GraphQlErrorCode.FailedToFetchBudget) {
      return "Failed to fetch monthly budget...";
    }
  }
  return null;
}
