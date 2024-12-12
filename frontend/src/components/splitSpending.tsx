import { Accessor, createEffect, createSignal, Setter } from "solid-js";
import { MonthlyBudget, MonthlySpending } from "~/monthlyBudget";
import { calculateMonthlySpending } from "./monthlySpending";

export default function (props: {
  monthlyBudget: Accessor<MonthlyBudget | null>;
  setMonthlyBudget: Setter<MonthlyBudget | null>;
}) {
  const [monthlySpending, setMonthlySpending] = createSignal(0);
  createEffect(() => {
    setMonthlySpending(
      calculateMonthlySpending(
        props.monthlyBudget()?.spending as MonthlySpending,
      ),
    );
  });
  return (
    <div id="split-budget">
      <p>
        <b>Shawn</b>({props.monthlyBudget()?.budget.shawn_percentage_allocation}
        %): ${calculatePercentage(monthlySpending(), props.monthlyBudget()?.budget.shawn_percentage_allocation ?? 0)}
      </p>

      <p>
        <b>Maggie</b>({props.monthlyBudget()?.budget.maggie_percentage_allocation}
        %): ${calculatePercentage(monthlySpending(), props.monthlyBudget()?.budget.maggie_percentage_allocation ?? 0)}
      </p>
    </div>
  );
}

/**
 * Calculate the percentage of a number
 * @param total - the total amount
 * @param percentage - percentage of the total
 * @returns the `percentage` of the `total`
 */
function calculatePercentage(total: number, percentage: number) {
  return total * (percentage / 100);
}
