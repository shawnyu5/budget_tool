import "./index.css";
import {
  createEffect,
  createResource,
  createSignal,
  ErrorBoundary,
  Show,
  Suspense,
} from "solid-js";
import MonthlySpending from "~/components/monthlySpending";
import BudgetTable from "~/components/budgetTable";
import { useNavigate, useSearchParams } from "@solidjs/router";
import log from "~/logger";
import SplitBudget from "~/components/splitBudget";
import ErrorComponent from "~/components/errorComponent";
import NavBar from "~/components/navBar";
import { Month, MonthlyBudget } from "~/generated/graphql";
import {
  handleGraphQLClientError,
  handleGraphQLErrorObject,
  NewGraphQLSDK,
} from "~/graphql";

export default function Home() {
  const [searchParam, _setSearchParam] = useSearchParams();
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);
  const [searchParamSignal, _setSearchParamSignal] = createSignal(searchParam);
  const graphqlSdk = NewGraphQLSDK();

  /**
   * Update the budget resource
   * @param budget - the new budget
   */
  function setMonthlyBudget(budget: MonthlyBudget) {
    log.info("Mutating monthly budget");
    mutate(budget);
  }

  const navigate = useNavigate();
  const [monthlyBudgetResource, { mutate }] = createResource(
    () => [searchParamSignal().year, searchParamSignal().month],
    async () => {
      if (!searchParamSignal().year || !searchParamSignal().month) {
        return null;
      }
      log.info(
        `[Resource] Fetching budget for month ${searchParamSignal().month}`,
      );
      try {
        let response = await graphqlSdk.GetMonthBudget({
          year: parseInt(searchParam.year as string),
          month: searchParam.month as Month,
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
    },
  );

  createEffect(async () => {
    // Only sync with backend if data changes. This also prevents making a round trip to the server on page load
    const budget = monthlyBudgetResource();
    if (!budget) {
      return;
    }
    log.info(
      `Updating monthly budget in backend: ${JSON.stringify(budget, null, 3)}`,
    );

    try {
      const response = await graphqlSdk.UpdateMonthlyBudget({
        inputs: {
          year: Number(searchParam.year),
          month: searchParam.month as Month,
          budget: {
            month: searchParam.month as Month,
            overBudgetAmount: budget.overBudgetAmount,
            spending: budget.spending,
            totalSpending: budget.totalSpending,
            carriedOverFrom: budget.carriedOverFrom,
            budget: {
              totalAllocation: budget.budget.totalAllocation,
              shawnContributionAmount: budget.budget.shawnContributionAmount,
              shawnPercentageAllocation:
                budget.budget.shawnPercentageAllocation,
              maggieContributionAmount: budget.budget.maggieContributionAmount,
              maggiePercentageAllocation:
                budget.budget.maggiePercentageAllocation,
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
  });

  return (
    <main>
      <NavBar />
      <ErrorBoundary fallback={<p>Failed to load budget</p>}>
        <Suspense fallback={<p>Loading...</p>}>
          <span class="flex flex-col">
            <Show when={Notification.permission === "denied"}>
              <ErrorComponent errorMessage="This app needs to send notifications! Some functionality may not work properly without this permission" />
            </Show>
          </span>
          <ErrorComponent errorMessage={errorMessage()} />
          <MonthlySpending monthlyBudget={monthlyBudgetResource} />
          <SplitBudget monthlyBudget={monthlyBudgetResource} />
          <br />
          <BudgetTable
            monthlyBudget={monthlyBudgetResource}
            setMonthlyBudget={setMonthlyBudget}
          />
        </Suspense>
      </ErrorBoundary>
    </main>
  );
}
