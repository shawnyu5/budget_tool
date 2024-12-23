import "./index.css";
import {
  createEffect,
  createResource,
  createSignal,
  ErrorBoundary,
} from "solid-js";
import MonthlySpending from "~/components/monthlySpending";
import BudgetTable from "~/components/budgetTable";
import { useNavigate, useSearchParams } from "@solidjs/router";
import {
  MonthlyBudgetErrors,
  getMonthlyBudget,
  MonthlyBudget,
  updateMonthlyBudget,
} from "~/server";
import log from "~/logger";
import SplitBudget from "~/components/splitBudget";
import ErrorComponent from "~/components/errorComponent";
import MonthsDropDown from "~/components/monthsDropDown";
import axios from "axios";

export default function Home() {
  const [searchParam, _setSearchParam] = useSearchParams();
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);
  const [searchParamSignal, _setSearchParamSignal] = createSignal(searchParam);
  const [monthlyBudget, setMonthlyBudget] = createSignal<MonthlyBudget | null>(
    null,
  );
  const navigate = useNavigate();

  const [monthlyBudgetResource] = createResource(
    () => [searchParamSignal().year, searchParamSignal().month],
    async () => {
      if (!searchParamSignal().year || !searchParamSignal().month) {
        return null;
      }
      log.info(`Fetching budget for month ${searchParamSignal().month}`);
      try {
        const budget = await getMonthlyBudget(
          searchParamSignal().year as string,
          searchParamSignal().month as string,
        );

        // If fetching is successful, make sure the error message is gone
        setErrorMessage(null);
        return budget;
      } catch (e) {
        if (e == MonthlyBudgetErrors.RE_AUTH_NEEDED) {
          navigate("/login", { replace: true });
        } else if (e == MonthlyBudgetErrors.FAILED_TO_FETCH_BUDGET) {
          setErrorMessage("Failed to fetch monthly budget...");
        }
      }
      return null;
    },
  );

  // monthlyBudget signal needs to be kept up to date with the resource, since the signal is what we are passing down to components
  createEffect(() => {
    if (!monthlyBudgetResource()) return null;
    setMonthlyBudget(monthlyBudgetResource()!);
  });

  createEffect(async () => {
    // Only sync with backend if data changes. This also prevents making a round trip to the server on page load
    if (!monthlyBudget() || monthlyBudget() == monthlyBudgetResource()) {
      return;
    }
    log.info(
      `Updating monthly budget in backend: ${JSON.stringify(monthlyBudget(), null, 3)}`,
    );
    try {
      await updateMonthlyBudget(
        searchParam.year as string,
        searchParam.month as string,
        monthlyBudget()!,
      );

    } catch (e) {
      // setErrorMessage("Failed to update monthly budget...");
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
      log.info(`Failed to get monthly budget`);
      throw new Error("Failed to get monthly budget");
    }
  });

  return (
    <main>
      <ErrorBoundary fallback={<p>Failed to load budget</p>}>
        <span class="inline-flex-container">
          <MonthsDropDown />
          <button
            class="button"
            onClick={() => {
              navigate("/settings", { replace: true });
            }}
          >
            Settings
          </button>
        </span>
        <ErrorComponent message={errorMessage()} />
        <MonthlySpending
          monthlyBudget={monthlyBudget}
          setMonthlyBudget={setMonthlyBudget}
        />
        <SplitBudget
          monthlyBudget={monthlyBudget}
          setMonthlyBudget={setMonthlyBudget}
        />
        <br />
        <BudgetTable
          monthlyBudget={monthlyBudget}
          setMonthlyBudget={setMonthlyBudget}
        />
      </ErrorBoundary>
    </main>
  );
}
