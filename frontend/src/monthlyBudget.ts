import axios, { AxiosResponse } from "axios";
import { paths } from "./backend_schema";
import { loadConfig } from "./config";
import log from "./logger";

// The budget for a month
export type monthlyBudgetType =
  paths["/budget/{year}/{month}"]["get"]["responses"][200]["content"]["application/json"];

/**
 * Get the budget for a specific month in a specific year
 * @param year - the year
 * @param month - the month to get the budget of
 */
export async function getMonthlyBudget(
  year: string,
  month: string,
): Promise<monthlyBudgetType> {
  const url = `${loadConfig().backendUrl}/budget/${year}/${month}`;
  try {
    let response: AxiosResponse<monthlyBudgetType> = await axios.get(url);
    return response.data;
  } catch (e) {
    log.info(`Failed to get monthly budget`);
    return Promise.reject("Failed to get monthly budget");
  }
}

/**
 * Calculates the total spending for a month
 * @param monthlyBudget - the month's budget to calculate the total of
 */
export function totalSpending(monthlyBudget: monthlyBudgetType): number {
   if (!monthlyBudget) {
      return 0
   }
  let total = 0;
  for (let spending of monthlyBudget.spending) {
    total += spending.amount;
  }
  return total;
}

