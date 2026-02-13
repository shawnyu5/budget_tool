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
import {
  basicAuthHandlerV2,
  saveNotificationSubscriptionHandler,
} from "~/client/sdk.gen";
import {
  handleGraphQLClientError,
  handleGraphQLErrorObject,
  NewGraphQLSDK,
} from "./graphql";
import {
  BudgetConfig,
  BudgetConfigInput,
  FireflySettings,
  Month,
  MonthlyBudget,
  SettingsPageDataQuery,
  UpdateMonthlyBudgetConfigMutation,
} from "./generated/graphql";

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
  try {
    let response = await sdk.GetMonthBudget({
      year: parseInt(year),
      month: month,
    });

    if (response.monthlyBudget.__typename == "GraphQLErrorObject") {
      const err = handleGraphQLErrorObject(response.monthlyBudget);
      if (err) {
        throw new Error(err);
      }
    }
    return response.monthlyBudget as MonthlyBudget;
  } catch (e) {
    handleGraphQLClientError(e, navigate);
  }
}

export type SettingsPageDataSuccess = Omit<
  SettingsPageDataQuery,
  "monthlyBudgetConfig"
> & {
  monthlyBudgetConfig: Extract<
    SettingsPageDataQuery["monthlyBudgetConfig"],
    { __typename: "BudgetConfig" }
  >;
  firefly: Extract<
    SettingsPageDataQuery["firefly"],
    { __typename: "FireflySuccessResponse" }
  >;
};

export async function getSettingsPageData(
  year: string,
  month: Month,
  navigate: Navigator,
): Promise<SettingsPageDataSuccess> {
  const sdk = NewGraphQLSDK();
  try {
    let response = await sdk.SettingsPageData({
      year: parseInt(year),
      month,
    });
    if (response.monthlyBudgetConfig.__typename == "GraphQLErrorObject") {
      const err = handleGraphQLErrorObject(response.monthlyBudgetConfig);
      if (err) {
        throw new Error(err);
      }
    }

    if (response.firefly.__typename == "FireflyErrorObject") {
      throw new Error(response.firefly.message);
    }

    return response as SettingsPageDataSuccess;
  } catch (e) {
    handleGraphQLClientError(e, navigate);
  }
}

/**
 * Updates the monthly budget for a specific year and month with a new budget
 * @param year - the year
 * @param month - the month
 * @param monthlyBudget - the updated monthly budget
 * @throws `MonthlyBudgetErrors` when updating the budget fails
 */
export async function updateMonthlyBudget(
  year: string,
  month: Month,
  monthlyBudget: MonthlyBudget | null,
  navigate: Navigator,
) {
  if (!monthlyBudget) return;

  const sdk = NewGraphQLSDK();
  try {
    const response = await sdk.UpdateMonthlyBudget({
      inputs: {
        year: Number(year),
        month: month,
        budget: {
          month: month,
          overBudgetAmount: monthlyBudget.overBudgetAmount,
          spending: monthlyBudget.spending,
          totalSpending: monthlyBudget.totalSpending,
          carriedOverFrom: monthlyBudget.carriedOverFrom,
          budget: {
            totalAllocation: monthlyBudget.budget.totalAllocation,
            shawnContributionAmount:
              monthlyBudget.budget.shawnContributionAmount,
            shawnPercentageAllocation:
              monthlyBudget.budget.shawnPercentageAllocation,
            maggieContributionAmount:
              monthlyBudget.budget.maggieContributionAmount,
            maggiePercentageAllocation:
              monthlyBudget.budget.maggiePercentageAllocation,
          },
        },
      },
    });

    if (response.updateMonthlyBudget.__typename == "GraphQLErrorObject") {
      const err = handleGraphQLErrorObject(response.updateMonthlyBudget);
      if (err) {
        console.error(err);
        throw new Error(err);
      }

      return response.updateMonthlyBudget;
    }
  } catch (e) {
    handleGraphQLClientError(e, navigate);
  }
}

/**
 * Updates the budget config for a specific month
 */
export async function updateMonthlyBudgetConfig(
  year: number,
  month: Month,
  budgetConfig: BudgetConfig,
  fireflySettings: FireflySettings,
  navigate: Navigator,
): Promise<UpdateMonthlyBudgetConfigMutation> {
  // __AUTO_GENERATED_PRINT_VAR_START__
  console.log("updateMonthlyBudgetConfig fireflySettings:", fireflySettings); // __AUTO_GENERATED_PRINT_VAR_END__
  const sdk = NewGraphQLSDK();
  try {
    const budgetConfigInput: BudgetConfigInput = {
      totalAllocation: budgetConfig.totalAllocation,
      maggieContributionAmount: budgetConfig.maggieContributionAmount,
      maggiePercentageAllocation: budgetConfig.maggiePercentageAllocation,
      shawnContributionAmount: budgetConfig.shawnContributionAmount,
      shawnPercentageAllocation: budgetConfig.shawnPercentageAllocation,
    };
    const response = await sdk.UpdateMonthlyBudgetConfig({
      inputs: {
        year,
        month,
        budgetConfig: budgetConfigInput,
        firefly: {
          enabled: fireflySettings.enabled,
          apiKey: fireflySettings.apiKey,
          sourceAccount: fireflySettings.sourceAccount,
        },
      },
    });

    if (response.updateMonthlyBudgetConfig.__typename == "GraphQLErrorObject") {
      const err = handleGraphQLErrorObject(response.updateMonthlyBudgetConfig);
      if (err) {
        throw new Error(err);
      }
    }
    return response;
  } catch (e) {
    handleGraphQLClientError(e, navigate);
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
  const response = await basicAuthHandlerV2({
    headers: {
      Authorization: `Basic ${base64Encoded}`,
    },
  });

  if (response.error && response.isAxiosError) {
    throw response;
  }

  setLocalAuthToken(response.data ?? "");
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
