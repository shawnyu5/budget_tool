import { graphql, HttpResponse } from "msw";
import { Month } from "~/generated/graphql";
import { generateSpendingItemID, monthNumberToName } from "~/utils";

const date = new Date();
export const graphqlHandlers = [
   graphql.query("GetMonthBudget", () => {
      return HttpResponse.json({
         data: {
            monthlyBudget: {
               __typename: "MonthlyBudget",
               month: monthNumberToName(date.getMonth()) as Month,
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
               carriedOverFrom: 100,
               totalSpending: 200,
               budget: {
                  totalAllocation: 300,
                  shawnPercentageAllocation: 60,
                  shawnContributionAmount: 180,
                  maggiePercentageAllocation: 40,
                  maggieContributionAmount: 120,
               },
            },
         },
      });
   }),
   graphql.query("getConfig", () => {
      return HttpResponse.json({
         data: {
            config: {
               encryptionPublicKey: "ahhhh",
               vapidPublicKey: "ahhhh",
            },
         },
      });
   }),
   graphql.query("GetMonthlyBudgetConfig", () => {
      return HttpResponse.json({
         data: {
            monthlyBudgetConfig: {
               __typename: "BudgetConfig",
               totalAllocation: 300,
               shawnPercentageAllocation: 60,
               shawnContributionAmount: 180,
               maggiePercentageAllocation: 40,
               maggieContributionAmount: 120,
            },
         },
      });
   }),
];
