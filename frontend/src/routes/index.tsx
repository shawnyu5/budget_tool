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
import {
  getMonthlyBudget,
  MonthlyBudgetErrors,
  updateMonthlyBudget,
} from "~/server";
import log from "~/logger";
import SplitBudget from "~/components/splitBudget";
import ErrorComponent from "~/components/errorComponent";
import NavBar from "~/components/navBar";
import axios from "axios";
import { Month, MonthlyBudget } from "~/generated/graphql";

export default function Home() {
  const [searchParam, _setSearchParam] = useSearchParams();
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);
  const [searchParamSignal, _setSearchParamSignal] = createSignal(searchParam);

  /**
   * Update the budget resource
   * @param budget - the new budget
   */
  function setMonthlyBudget(budget: MonthlyBudget) {
    log.info("Mutating monthly budget");
    mutate(budget);
  }

  const navigate = useNavigate();
  const [monthlyBudgetResource, { refetch, mutate }] = createResource(
    () => [searchParamSignal().year, searchParamSignal().month],
    async () => {
      if (!searchParamSignal().year || !searchParamSignal().month) {
        return null;
      }
      log.info(
        `[Resource] Fetching budget for month ${searchParamSignal().month}`,
      );
      const monthlyBudget = await getMonthlyBudget(
        searchParamSignal().year as string,
        searchParamSignal().month as Month,
        navigate,
      );
      return monthlyBudget;
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
      await updateMonthlyBudget(
        searchParam.year as string,
        searchParam.month as Month,
        budget,
        navigate,
      );
    } catch (e) {
      if (axios.isAxiosError(e)) {
        if (e.response?.status == 404) {
          log.info("No budget recorded for this month");
          throw MonthlyBudgetErrors.FAILED_TO_FETCH_BUDGET;
        } else if (e.response?.status == 403) {
          log.info("Access forbidden");
          throw MonthlyBudgetErrors.FORBIDDEN;
        } else if (e.response?.status == 401) {
          log.info("Authenication token expired. Needs re authenication");
          throw MonthlyBudgetErrors.RE_AUTH_NEEDED;
        }
      }
      throw new Error(`Failed to update monthly budget: ${e}`);
    }
  });

  return (
    <main>
      <NavBar />
      <ErrorBoundary fallback={<p>Failed to load budget</p>}>
        <Suspense fallback={<p>Loading...</p>}>
          <span class="flex flex-col">
            <Show when={Notification.permission === "denied"}>
              <ErrorComponent message="This app needs to send notifications! Some functionality may not work properly without this permission" />
            </Show>
          </span>
          <ErrorComponent message={errorMessage()} />
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
