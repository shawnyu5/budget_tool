import "./monthlySpending.css";
import { Accessor, createEffect, createSignal, Setter } from "solid-js";
import log from "~/logger";
import { MonthlyBudget, MonthlySpending } from "~/monthlyBudget";
import { useMonthlyBudget } from "~/useMonthlyBudget";
/**
 * Displays the monthly spending. Including:
 * - The total budget for the month
 * - The total spending
 * - Amount left in budget
 */
export default function (props: {
   monthlyBudget: Accessor<MonthlyBudget | null>,
   setMonthlyBudget: Setter<MonthlyBudget | null>
}) {
  // const [monthlyBudget] = useMonthlyBudget();
  // Total amount spend in a month
  const [totalMonthlySpending, setTotalMonthlySpending] = createSignal(0);
  createEffect(() => {
    log.info(`Calculating total monthly spending`);
    if (!props.monthlyBudget()) {
      return;
    }
    const totalSpending = calculateMonthlySpending(
      props.monthlyBudget()?.spending as MonthlySpending,
    );
    log.info(`Calculating total monthly spending: ${totalSpending}`);
    setTotalMonthlySpending(totalSpending);
  });

  return (
    <>
      <div class="container">
        <p>Remaining:</p>
        {
          // TODO: color should be dynamic, based on the percentage of month left
        }
        <h1 style="color: green">${totalMonthlySpending()}</h1>
        <h1>/${props.monthlyBudget()?.budget.total}</h1>
      </div>
    </>
  );
}
export function calculateMonthlySpending(
  monthlySpending: MonthlySpending,
): number {
  if (!monthlySpending) return 0;
  let total = 0;
  for (const spending of monthlySpending) {
    total += spending.amount;
  }
  return total;
}
