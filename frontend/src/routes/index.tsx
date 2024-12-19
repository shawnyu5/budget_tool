import "./index.css";
import {
  createEffect,
  createResource,
  createSignal,
  Show,
  Suspense,
} from "solid-js";
import MonthlySpending from "~/components/monthlySpending";
import BudgetTable from "~/components/budgetTable";
import { redirect, useNavigate, useSearchParams } from "@solidjs/router";
import { Errors, getMonthlyBudget, MonthlyBudget } from "~/monthlyBudget";
import log from "~/logger";
import axios from "axios";
import { loadConfig } from "~/config";
import SplitSpending from "~/components/splitSpending";

export default function Home() {
  const [searchParam, _setSearchParam] = useSearchParams();
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
      } catch (e) {
        if (e == Errors.FORBIDDEN) {
          navigate("/login", { replace: true });
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
