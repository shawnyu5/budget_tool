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
   let url = "";
   // __AUTO_GENERATED_PRINT_VAR_START__
   console.log("NewGraphQLSDK#if import:", import.meta.env.DEV); // __AUTO_GENERATED_PRINT_VAR_END__
   if (import.meta.env.DEV) {
      url = `${loadLocalConfig().backendUrl}/graphql`;
   } else {
      // __AUTO_GENERATED_PRINT_VAR_START__
      console.log(
         "NewGraphQLSDK#if loadLocalConfig():",
         loadLocalConfig().backendUrl,
      ); // __AUTO_GENERATED_PRINT_VAR_END__
      url = `${window.location.origin}/${loadLocalConfig().backendUrl}/graphql`;
   }

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
 * Handles errors returned by graphQL it self
 * @param err - the graphql error returned
 */
export function handleGraphQLError(
   err: GraphQlErrorObject,
   navigate: Navigator,
): string | null {
   if (err.code == GraphQlErrorCode.FailedToFetchBudget) {
      return "Failed to fetch budget...";
   } else if (err.code == GraphQlErrorCode.ServerError) {
      return "Something went wrong on the server...";
   } else if (err.code == GraphQlErrorCode.Forbidden) {
      navigate("/login", { replace: true });
   }
   return null;
}
