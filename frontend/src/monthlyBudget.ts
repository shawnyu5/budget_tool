import axios, { AxiosResponse } from "axios";
import { paths } from "./backend_schema";
import { loadConfig } from "./config";
import log from "./logger";
import { redirect } from "@solidjs/router";

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
export enum GetMonthlyBudgetErrors {
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
 */
export async function getMonthlyBudget(
  year: string,
  month: string,
): Promise<MonthlyBudget> {
  try {
    let response: AxiosResponse<MonthlyBudget> = await axios.get(
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
        return Promise.reject(GetMonthlyBudgetErrors.FAILED_TO_FETCH_BUDGET);
      } else if (e.response?.status == 403) {
        log.info("Access forbidden");
        return Promise.reject(GetMonthlyBudgetErrors.FORBIDDEN);
      } else if (e.response?.status == 401) {
         log.info("Authenication token expired. Needs re authenication")
         return Promise.reject(GetMonthlyBudgetErrors.RE_AUTH_NEEDED)
      }
    }
    log.info(`Failed to get monthly budget`);
    return Promise.reject(GetMonthlyBudgetErrors.FAILED_TO_FETCH_BUDGET);
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
