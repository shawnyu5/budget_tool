/**
 * Functions for communicating with the backend server
 *
 */
import axios, { AxiosResponse } from "axios";
import { paths } from "./backend_schema";
import { loadConfig } from "./config";
import log from "./logger";
import { useNavigate } from "@solidjs/router";

export type SpendingItem =
  paths["/budget/{year}/{month}"]["get"]["responses"][200]["content"]["application/json"]["spending"][0];

// The budget for a month
export type MonthlyBudget =
  paths["/budget/{year}/{month}"]["get"]["responses"][200]["content"]["application/json"];

// The spending for a month
export type MonthlySpending =
  paths["/budget/{year}/{month}"]["get"]["responses"][200]["content"]["application/json"]["spending"];

/**
 * Errors that could happen when fetching the monthly budget
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
  month: string,
): Promise<MonthlyBudget> {
  try {
    const response: AxiosResponse<MonthlyBudget> = await axios.get(
      `${loadConfig().backendUrl}/budget/${year}/${month}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      },
    );
    return response.data;
  } catch (e) {
    if (axios.isAxiosError(e)) {
      if (e.response?.status == 404) {
        log.info("No budget recorded for this month");
        return Promise.reject(MonthlyBudgetErrors.FAILED_TO_FETCH_BUDGET);
      } else if (e.response?.status == 403) {
        log.info("Access forbidden. Redirecting to login page");
        return Promise.reject(MonthlyBudgetErrors.FORBIDDEN);
      } else if (e.response?.status == 401) {
        log.info(
          "Authenication token expired. Needs re authenication. Redirecting to login page",
        );
        return Promise.reject(MonthlyBudgetErrors.RE_AUTH_NEEDED);
      }
    }
    log.info(`Failed to get monthly budget`);
    return Promise.reject(MonthlyBudgetErrors.FAILED_TO_FETCH_BUDGET);
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
  month: string,
  monthlyBudget: MonthlyBudget,
) {
  try {
    await axios.post(
      `${loadConfig().backendUrl}/budget/${year}/${month}`,
      monthlyBudget,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
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
  const token = localStorage.getItem("token");
  if (!token) {
    log.info("No JWT found...");
    return;
  }

  log.info("Found JTW token. Checking if token is still valid");
  const navigate = useNavigate();
  try {
    const response = await axios.get(
      `${loadConfig().backendUrl}/auth/validate-token`,
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
      `${loadConfig().backendUrl}/login/basic`,
      {},
      {
        headers: {
          Authorization: `Basic ${base64Encoded}`,
        },
      },
    );

    localStorage.setItem("token", response.data);
  } catch (e) {
    log.error(`Failed to login: ${e}`);
    throw e;
  }
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
