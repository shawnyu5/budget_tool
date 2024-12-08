import { Title } from "@solidjs/meta";
import "./index.css";
import { createSignal } from "solid-js";
import MonthsDropDown from "~/components/monthsDropDown";
import MonthlySpending from "~/components/monthlySpending";
import BudgetTable from "~/components/budgetTable";

export default function Home() {
  const [month, setMonth] = createSignal("1");
  return (
    <main>
      <Title>Budget tool</Title>
      <MonthsDropDown value={month} setValue={setMonth} />
      <MonthlySpending />
      <button style="background: red">Split</button>
      <br />
      <br />
      <BudgetTable />
    </main>
  );
}
