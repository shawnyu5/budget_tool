import "./index.css";
import { createEffect, createResource, createSignal } from "solid-js";
import MonthlySpending from "~/components/monthlySpending";
import BudgetTable from "~/components/budgetTable";
import { useNavigate, useSearchParams } from "@solidjs/router";
import {
  GetMonthlyBudgetErrors,
  getMonthlyBudget,
  MonthlyBudget,
} from "~/monthlyBudget";
import log from "~/logger";
import axios from "axios";
import { loadConfig } from "~/config";
import SplitSpending from "~/components/splitSpending";
import ErrorComponent from "~/components/errorComponent";
import MonthsDropDown from "~/components/monthsDropDown";

export default function Home() {
  const [searchParam, _setSearchParam] = useSearchParams();
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);
  const [searchParamSignal, _setSearchParamSignal] = createSignal(searchParam);
  const [monthlyBudget, setMonthlyBudget] = createSignal<MonthlyBudget | null>(
    null,
  );
  const navigate = useNavigate();

  createResource(
    () => [searchParamSignal().year, searchParamSignal().month],
    async () => {
      log.info(`Fetching budget for month ${searchParamSignal().month}`);
      try {
        const budget = await getMonthlyBudget(
          searchParamSignal().year as string,
          searchParamSignal().month as string,
        );

        setMonthlyBudget(budget);
        // If fetching is successful, make sure the error message is gone
        setErrorMessage(null);
      } catch (e) {
        if (e == GetMonthlyBudgetErrors.FORBIDDEN) {
          navigate("/login", { replace: true });
        } else if (e == GetMonthlyBudgetErrors.FAILED_TO_FETCH_BUDGET) {
          setErrorMessage("Failed to fetch monthly budget...");
        }
      }
    },
  );

  createEffect(() => {
    if (!monthlyBudget()) {
      return;
    }
    log.info(
      `Updating monthly budget in backend: ${JSON.stringify(monthlyBudget(), null, 3)}`,
    );
    axios.post(
      `${loadConfig().backendUrl}/budget/${searchParam.year}/${searchParam.month}`,
      monthlyBudget(),
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      },
    );
  });

  return (
    <main>
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
      <SplitSpending
        monthlyBudget={monthlyBudget}
        setMonthlyBudget={setMonthlyBudget}
      />
      <br />
      <BudgetTable
        monthlyBudget={monthlyBudget}
        setMonthlyBudget={setMonthlyBudget}
      />
    </main>
  );
}
