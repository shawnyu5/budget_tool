import { Title } from "@solidjs/meta";
import "./index.css";
import { createSignal } from "solid-js";
import MonthsDropDown from "~/components/monthsDropDown";
import MonthlySpending from "~/components/monthlySpending";
import BudgetTable from "~/components/budgetTable";
import { useSearchParams } from "@solidjs/router";
import { monthNumberToName } from "~/utils";

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

  return (
    <main>
      <Title>Budget tool</Title>
      <MonthsDropDown />
      <MonthlySpending />
      <button style="background: red">Split</button>
      <br />
      <br />
      <BudgetTable />
    </main>
  );
}
