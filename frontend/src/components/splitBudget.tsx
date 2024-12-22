import { Accessor, createEffect, createSignal, Setter, Show } from "solid-js";
import { MonthlyBudget, MonthlySpending } from "~/monthlyBudget";
import { calculateMonthlySpending } from "./monthlySpending";

/**
 * The amount each person is responsible to pay, based on the month's budget
 */
export default function SplitBudget(props: {
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
        <b>Shawn</b> (
        {props.monthlyBudget()?.budget.shawn_percentage_allocation}
        %): $
        {calculatePercentage(
          monthlySpending(),
          props.monthlyBudget()?.budget.shawn_percentage_allocation ?? 0,
        ) +
          overBudgetAmount(props.monthlyBudget()) / 2}
      </p>

      <p>
        <b>Maggie</b> (
        {props.monthlyBudget()?.budget.maggie_percentage_allocation}
        %): $
        {calculatePercentage(
          monthlySpending(),
          props.monthlyBudget()?.budget.maggie_percentage_allocation ?? 0,
        ) +
          overBudgetAmount(props.monthlyBudget()) / 2}
      </p>

      <Show when={overBudgetAmount(props.monthlyBudget()) != 0}>
        <p style="color: red">
          Over budget by ${overBudgetAmount(props.monthlyBudget())}. Splitting
          50/50 - <b>${overBudgetAmount(props.monthlyBudget()) / 2}</b> per
          person
        </p>
      </Show>
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

/**
 * Calculates amount spent over a month's budget
 * @param monthlyBudget - the budget for the month
 * @returns 0 if we are not over budget. Otherwise returns the amount over by
 */
function overBudgetAmount(monthlyBudget: MonthlyBudget | null): number {
  // TODO: we shouldnt need to do another calculation here once there is a `total_spending` field in the db
  // TODO: consider tracking this number in the db as well
  if (!monthlyBudget) return 0;
  const monthlySpending = calculateMonthlySpending(monthlyBudget.spending);
  if (monthlySpending > monthlyBudget.budget.total) {
    return monthlySpending - monthlyBudget.budget.total;
  }
  return 0;
}
