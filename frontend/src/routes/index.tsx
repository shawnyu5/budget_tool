import "./index.css";
import { createEffect, createResource, createSignal } from "solid-js";
import MonthlySpending from "~/components/monthlySpending";
import BudgetTable from "~/components/budgetTable";
import { useSearchParams } from "@solidjs/router";
import { getMonthlyBudget, MonthlyBudget } from "~/monthlyBudget";
import log from "~/logger";
import axios from "axios";
import { loadConfig } from "~/config";

export default function Home() {
  const [searchParam, _setSearchParam] = useSearchParams();
  const [searchParamSignal, _setSearchParamSignal] = createSignal(searchParam);
  const [monthlyBudget, setMonthlyBudget] = createSignal<MonthlyBudget | null>(
    null,
  );

  createResource(
    () => [searchParamSignal().year, searchParamSignal().month],
    async () => {
      log.info(`Fetching budget for month ${searchParamSignal().month}`);
      setMonthlyBudget(
        await getMonthlyBudget(
          searchParamSignal().year as string,
          searchParamSignal().month as string,
        ),
      );
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
    );
  });

  return (
    <main>
      <MonthlySpending
        monthlyBudget={monthlyBudget}
        setMonthlyBudget={setMonthlyBudget}
      />

      <button style="background: red">Split</button>
      <br />
      <br />
      <BudgetTable
        monthlyBudget={monthlyBudget}
        setMonthlyBudget={setMonthlyBudget}
      />
    </main>
  );
}
