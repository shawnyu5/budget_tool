import { Resource, Show } from "solid-js";
import { MonthlyBudget } from "~/server";

/**
 * The amount each person is responsible to pay, based on the month's budget. Including displaying any amount that is over budget
 */
export default function SplitBudget(props: {
  monthlyBudget: Resource<MonthlyBudget | null>;
}) {

  return (
    <div id="split-budget">
      <p>
        <b>Shawn</b> (
        {props.monthlyBudget()?.budget.shawn_percentage_allocation}
        %): $
        {calculatePercentage(
          props.monthlyBudget()?.totalSpending ?? 0,
          props.monthlyBudget()?.budget.shawn_percentage_allocation ?? 0,
        ) +
          (props.monthlyBudget()?.overBudgetAmount ?? 0) / 2}
      </p>

      <p>
        <b>Maggie</b> (
        {props.monthlyBudget()?.budget.maggie_percentage_allocation}
        %): $
        {calculatePercentage(
          props.monthlyBudget()?.totalSpending ?? 0,
          props.monthlyBudget()?.budget.maggie_percentage_allocation ?? 0,
        ) +
          (props.monthlyBudget()?.overBudgetAmount ?? 0) / 2}
      </p>

      <Show when={props.monthlyBudget()?.overBudgetAmount != 0}>
        <p style="color: red">
          Over budget by ${props.monthlyBudget()?.overBudgetAmount}. Splitting
          50/50 - <b>${(props.monthlyBudget()?.overBudgetAmount ?? 0) / 2}</b>{" "}
          per person
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
