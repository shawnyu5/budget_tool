import { http, HttpResponse } from "msw";
import { loadLocalConfig } from "../config";
import { generateSpendingItemID, monthNumberToName } from "~/utils";
import { components } from "~/backend_schema";
import { MonthlyBudget } from "~/client";

const date = new Date();

export const httpHandlers = [
  http.get(`${loadLocalConfig().backendUrl}/auth/validate-token`, () => {
     return HttpResponse.text("Success")
  }),
  http.get(`${loadLocalConfig().backendUrl}/`, () => {
    // ...and respond to them using this JSON response.
    return HttpResponse.json({
      version: "1.0.0",
    });
  }),
  http.post(`${loadLocalConfig().backendUrl}/login/basic`, () => {
    return HttpResponse.text("Authenicated");
  }),
  // This route will return data that is on budget
  http.get(
    `${loadLocalConfig().backendUrl}/budget/${date.getFullYear()}/${monthNumberToName(date.getMonth() + 1)}`,
    () => {
      const budget: MonthlyBudget = {
        month: monthNumberToName(
          date.getMonth(),
        ) as components["schemas"]["Month"],
        budget: {
          totalAllocation: 300,
          shawnPercentageAllocation: 60,
          shawnContributionAmount: 180,
          maggiePercentageAllocation: 40,
          maggieContributionAmount: 120,
        },
        totalSpending: 200,
        overBudgetAmount: 0,
        spending: [
          {
            id: generateSpendingItemID(),
            date: `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`,
            amount: 100,
            description: "Test description",
            notes: "Test notes",
          },
          {
            id: generateSpendingItemID(),
            date: `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`,
            amount: 100,
            description: "Test description 2",
            notes: "Test notes 2",
          },
        ],
      };
      return HttpResponse.json(budget);
    },
  ),
  http.post(
    `${loadLocalConfig().backendUrl}/budget/${date.getFullYear()}/${monthNumberToName(date.getMonth() + 1)}`, () => {
      const budget: MonthlyBudget = {
        month: monthNumberToName(
          date.getMonth(),
        ) as components["schemas"]["Month"],
        budget: {
          totalAllocation: 300,
          shawnPercentageAllocation: 60,
          shawnContributionAmount: 180,
          maggiePercentageAllocation: 40,
          maggieContributionAmount: 120,
        },
        totalSpending: 200,
        overBudgetAmount: 0,
        spending: [
          {
            id: generateSpendingItemID(),
            date: `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`,
            amount: 100,
            description: "Test description",
            notes: "Test notes",
          },
          {
            id: generateSpendingItemID(),
            date: `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`,
            amount: 100,
            description: "Test description 2",
            notes: "Test notes 2",
          },
        ],
      };
       return HttpResponse.json(budget)
    })
];
