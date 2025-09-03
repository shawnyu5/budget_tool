/**
 * Functions for communicating with the backend server
 *
 */
import axios from "axios";
import { Navigator } from "@solidjs/router";
import { paths } from "./backend_schema";
import { loadLocalConfig } from "./config";
import log from "./logger";
import { useNavigate } from "@solidjs/router";
import { getLocalAuthToken, setLocalAuthToken } from "./utils";
import axiosRetry from "axios-retry";
import { client } from "~/client/client.gen";
import { saveNotificationSubscriptionHandler } from "~/client/sdk.gen";
import { handleGraphQLError, NewGraphQLSDK } from "./graphql";
import { Month, MonthlyBudget } from "./generated/graphql";
import logger from "./logger";

axiosRetry(axios, {
  retries: 4,
  retryDelay: axiosRetry.exponentialDelay,
});

client.setConfig({
  baseURL: loadLocalConfig().backendUrl,
  axios: axios,
});

export type SpendingItem =
  paths["/budget/{year}/{month}"]["get"]["responses"][200]["content"]["application/json"]["spending"][0];

// // The budget for a month
// export type MonthlyBudget =
// paths["/budget/{year}/{month}"]["get"]["responses"][200]["content"]["application/json"];

// The spending for a month
export type MonthlySpending =
  paths["/budget/{year}/{month}"]["get"]["responses"][200]["content"]["application/json"]["spending"];

/**
 * Errors that could happen when fetching the monthly budget
 * @deprecated use GraphQlErrorCode instead
 */
export enum MonthlyBudgetErrors {
  /**
   * Failed to fetch the budget for a particular month
   **/
  FAILED_TO_FETCH_BUDGET,
  /**
   * Forbidden to fetch the budget. User does not have the correct access
   **/
  FORBIDDEN,
  /**
   * Authentication token expired. Needs re authentication
   */
  RE_AUTH_NEEDED,
}

/**
 * Get the budget for a specific month in a specific year
 * @param year - the year
 * @param month - the month to get the budget of
 * @throws `MonthlyBudgetErrors` when fetching the budget fails
 */
export async function getMonthlyBudget(
  year: string,
  month: Month,
  navigate: Navigator,
): Promise<MonthlyBudget | null> {
  const sdk = NewGraphQLSDK();
  let response = await sdk.GetMonthBudget({
    year: parseInt(year),
    month: month,
  });

  if (response.monthlyBudget.__typename == "GraphQLErrorObject") {
    const err = handleGraphQLError(response.monthlyBudget, navigate);
    if (err) {
      throw new Error(err);
    }
  }
  return response.monthlyBudget as MonthlyBudget;
}

// if (response.monthlyBudget.__typename == "GraphQLErrorObject") {
//     logger.info("Found graphql error");
//     const err = response.monthlyBudget.code;
//     if (err == GraphQlErrorCode.Forbidden) {
//        navigate("/login", { replace: true });
//        throw new Error("Forbidden, redirecting to login");
//     } else if (GraphQlErrorCode.FailedToFetchBudget) {
//        throw new Error("Failed to fetch monthly budget...");
//     } else {
//        throw new Error("Something went wrong!");
//     }
//  }

/**
 * Updates the monthly budget for a specific year and month with a new budget
 * @param year - the year
 * @param month - the month
 * @param monthlyBudget - the updated monthly budget
 * @throws `MonthlyBudgetErrors` when updating the budget fails
 */
export async function updateMonthlyBudget(
  year: string,
  month: string,
  monthlyBudget: MonthlyBudget,
) {
  try {
    await axios.post(
      `${loadLocalConfig().backendUrl}/budget/${year}/${month}`,
      monthlyBudget,
      {
        headers: {
          Authorization: `Bearer ${getLocalAuthToken()}`,
        },
      },
    );
  } catch (e) {
    if (axios.isAxiosError(e)) {
      if (e.response?.status == 404) {
        log.info("No budget recorded for this month");
        return Promise.reject(MonthlyBudgetErrors.FAILED_TO_FETCH_BUDGET);
      } else if (e.response?.status == 403) {
        log.info("Access forbidden");
        return Promise.reject(MonthlyBudgetErrors.FORBIDDEN);
      } else if (e.response?.status == 401) {
        log.info("Authenication token expired. Needs re authenication");
        return Promise.reject(MonthlyBudgetErrors.RE_AUTH_NEEDED);
      }
    }
    log.info(`Failed to get monthly budget`);
    return Promise.reject(MonthlyBudgetErrors.FAILED_TO_FETCH_BUDGET);
  }
}

/**
 * Validate the JWT token with the server. If the token is invalid or expired, redirect to `/login`
 */
export async function validateJTWToken() {
  log.info("Checking if there is a JWT token present");
  const token = getLocalAuthToken();
  if (!token) {
    log.info("No JWT found...");
    return;
  }

  log.info("Found JTW token. Checking if token is still valid");
  const navigate = useNavigate();
  try {
    const response = await axios.get(
      `${loadLocalConfig().backendUrl}/auth/validate-token`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    if (response.status == 200) {
      log.info("Token is valid. Redirecting to home page");
      navigate("/", { replace: true });
    }
  } catch (e) {
    log.info("Token is no longer valid. Redirecting to login page");
    navigate("/login", { replace: true });
  }
}

/**
 * Performs basic auth. If authentication is successful, stores the resulting JWT token in local storage
 * @throws if authentication fails
 */
export async function basicAuthLogin(userName: string, password: string) {
  const base64Encoded = btoa(`${userName}:${password}`);
  try {
    const response = await axios.post(
      `${loadLocalConfig().backendUrl}/login/basic`,
      {},
      {
        headers: {
          Authorization: `Basic ${base64Encoded}`,
        },
      },
    );

    setLocalAuthToken(response.data);
  } catch (e) {
    log.error(`Failed to login: ${e}`);
    throw e;
  }
}

export async function saveNotificationSubscription(
  subscription: PushSubscription,
) {
  const response = await saveNotificationSubscriptionHandler({
    body: {
      endpoint: subscription.endpoint,
      keys: {
        auth: String(subscription.getKey("auth")),
        p256dh: String(subscription.getKey("p256dh")),
      },
      expirationTime: subscription.expirationTime,
    },
  });
  return response;
}
/**
 * Calculates the total spending for a month
 * @param monthlyBudget - the month's budget to calculate the total of
 */
export function calculateTotalSpending(monthlyBudget: MonthlyBudget): number {
  if (!monthlyBudget) {
    return 0;
  }
  let total = 0;
  for (let spending of monthlyBudget.spending) {
    total += spending.amount;
  }
  return total;
}

export async function exportCSV(year: string, month: string): Promise<string> {
  const response = await axios.get(
    `${loadLocalConfig().backendUrl}/export/${year}/${month}/csv`,
    {
      headers: {
        Authorization: `Bearer ${getLocalAuthToken()}`,
      },
    },
  );
  return response.data;
}
