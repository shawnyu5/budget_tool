/**
 * Wrapper to generate a graphql client with defaults
 */

import { ClientError, GraphQLClient } from "graphql-request";
import { Navigator } from "@solidjs/router";
import { loadLocalConfig } from "./config";
import { getLocalAuthToken } from "./utils";
import {
  getSdk,
  GraphQlErrorCode,
  GraphQlErrorObject,
} from "./generated/graphql";

/**
 * Construct a new GraphQL SDK that is ready to use
 * @returns a graphQL SDK
 */
export function NewGraphQLSDK() {
   const url = `${loadLocalConfig().backendUrl}/graphql`
  // let url = "";
  // if (import.meta.env.DEV) {
  //   url = `${loadLocalConfig().backendUrl}/graphql`;
  // } else {
  //   url = `${window.location.origin}/${loadLocalConfig().backendUrl}/graphql`;
  // }

  console.log(`Creating graphql client with ${url}`);
  const client = new GraphQLClient(url, {
    headers: {
      Authorization: `Bearer ${getLocalAuthToken()}`,
    },
  });

  return getSdk(client);
}

/**
 * Handles HTTP errors from graphQL, and performs redirection based on error response
 * @param res - the client error
 * @param navigate - Navigator used to perform navigation
 * @returns error message if any
 */
export function handleGraphQLHttpError(
  error: ClientError,
  navigate: Navigator,
): string | null {
  const code = error.response.status;
  if (code == 403) {
    navigate("/login", { replace: true });
  } else if (code == 500) {
    return "Something went wrong...";
  }
  return null;
}

/**
 * Handles errors returned by graphql resolvers
 * @param err - the graphql error returned
 */
export function handleGraphQLErrorObject(
  err: GraphQlErrorObject,
  navigate: Navigator,
): string | null {
  if (err.code == GraphQlErrorCode.FailedToFetchBudget) {
    return "Failed to fetch budget...";
  } else if (err.code == GraphQlErrorCode.ServerError) {
    return "Something went wrong on the server...";
  } else if (err.code == GraphQlErrorCode.Forbidden) {
    navigate("/login", { replace: true });
  } else if (err.code == GraphQlErrorCode.InvalidFireflyApiKey) {
    return err.message;
  }
  return null;
}

/**
 * Handles grapqhql client errors, errors that are produced before reaching a resolver, such as network or auth errors
 * On UNAUTHENTICATED errors, the user will redirect to `/login` page
 * Any other unrecognized errors will be thrown
 * @param e - the error thrown by a graphql call
 * @param navigate - solid JS router Navigator
 */
export function handleGraphQLClientError(
  e: unknown,
  navigate: Navigator,
): never {
  if (e instanceof ClientError) {
    console.log("Caught grapqhql error");
    if (e.response.errors?.some((e) => e.message == "UNAUTHENTICATED")) {
      navigate("/login", { replace: true });
    }
    throw e;
  } else {
    // network / unexpected errors
    throw e;
  }
}
