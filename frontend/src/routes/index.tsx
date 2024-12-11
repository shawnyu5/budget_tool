import { Title } from "@solidjs/meta";
import "./index.css";
import { createEffect, createResource, createSignal } from "solid-js";
import MonthsDropDown from "~/components/monthsDropDown";
import MonthlySpending from "~/components/monthlySpending";
import BudgetTable from "~/components/budgetTable";
import { useSearchParams } from "@solidjs/router";
import { monthNumberToName } from "~/utils";
import { getMonthlyBudget, MonthlyBudget } from "~/monthlyBudget";
import log from "~/logger";

export default function Home() {
  const [searchParam, setSearchParam] = useSearchParams();
  const date = new Date();

  // If year is not in the query param, set it to the current year
  if (!searchParam.year) {
    setSearchParam({ year: date.getFullYear() });
  }

  // If month is not in the query param, set it to the current month
  if (!searchParam.month) {
    setSearchParam({ month: monthNumberToName(date.getMonth()) });
  }

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

  return (
    <main>
      <Title>Budget tool</Title>
      <MonthsDropDown />
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
