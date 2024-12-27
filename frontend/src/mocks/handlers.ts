import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { setupWorker } from "msw/browser";
import { loadConfig } from "../config";
import { MonthlyBudget } from "~/server";
import { generateSpendingItemID, monthNumberToName } from "~/utils";
import { components } from "~/backend_schema";

const date = new Date();

export const handlers = [
  http.get(`${loadConfig().backendUrl}/`, () => {
    // ...and respond to them using this JSON response.
    return HttpResponse.json({
      version: "1.0.0",
    });
  }),
  http.post(`${loadConfig().backendUrl}/login/basic`, () => {
    return HttpResponse.text("Authenicated");
  }),
  // This route will return data that is on budget
  http.get(
    `${loadConfig().backendUrl}/budget/${date.getFullYear()}/${monthNumberToName(date.getMonth() + 1)}`,
    () => {
      const budget: MonthlyBudget = {
        month: monthNumberToName(
          date.getMonth(),
        ) as components["schemas"]["Month"],
        budget: {
          total: 300,
          maggie_percentage_allocation: 40,
          shawn_percentage_allocation: 60,
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
            description: "Test description 2 ",
            notes: "Test notes 2",
          },
        ],
      };
      return HttpResponse.json(budget);
    },
  ),
];
