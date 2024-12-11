import "./monthlySpending.css";
import { useSearchParams } from "@solidjs/router";
import {
  Accessor,
  createEffect,
  createResource,
  createSignal,
  Setter,
} from "solid-js";
import log from "~/logger";
import {
  MonthlyBudget as MonthlyBudget,
  calculateTotalSpending,
} from "~/monthlyBudget";
/**
 * Displays the monthly spending. Including:
 * - The total budget for the month
 * - The total spending
 * - Amount left in budget
 */
export default function (props: {
  monthlyBudget: Accessor<MonthlyBudget | null>;
  setMonthlyBudget: Setter<MonthlyBudget | null>;
}) {
  const [searchParam, _setSearchParam] = useSearchParams();
  const [monthlySpending, setMonthlySpending] = createSignal(0);

  createResource(
    () => props.monthlyBudget(),
    async () => {
      log.info("Calculating monthly spending");
      setMonthlySpending(
        calculateTotalSpending(props.monthlyBudget() as MonthlyBudget),
      );
    },
  );

  // createEffect(() => {
  //   log.info("Calculating total monthly spending");
  //   setMonthlySpending(
  //     calculateTotalSpending(monthlySpending() as MonthlyBudget),
  //   );
  // });
  return (
    <>
      <div class="container">
        <p>Remaining:</p>
        {
          // TODO: color should be dynamic, based on the percentage of month left
        }
        <h1 style="color: green">${monthlySpending()}</h1>
        <h1>/${props.monthlyBudget()?.budget.total}</h1>
      </div>
    </>
  );
}
