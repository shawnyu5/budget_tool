import { Resource, Show } from "solid-js";
import { MonthlyBudget } from "~/server";
import { calculatePercentage, round } from "~/utils";

/**
 * The amount each person is responsible to pay, based on the month's budget. Including displaying any amount that is over budget
 */
export default function SplitBudget(props: {
  monthlyBudget: Resource<MonthlyBudget | null>;
}) {
  return (
    <div id="split-budget">
      <p>
        <b>Shawn</b> ({props.monthlyBudget()?.budget?.shawnPercentageAllocation}
        %): $
        {round(
          calculatePercentage(
            (props.monthlyBudget()?.totalSpending ?? 0) -
              (props.monthlyBudget()?.overBudgetAmount ?? 0),
            props.monthlyBudget()?.budget?.shawnPercentageAllocation ?? 0,
          ) +
            (props.monthlyBudget()?.overBudgetAmount ?? 0) / 2,
        )}
      </p>

      <p>
        <b>Maggie</b> (
        {props.monthlyBudget()?.budget?.maggiePercentageAllocation}
        %): $
        {round(
          calculatePercentage(
            (props.monthlyBudget()?.totalSpending ?? 0) -
              (props.monthlyBudget()?.overBudgetAmount ?? 0),
            props.monthlyBudget()?.budget?.maggiePercentageAllocation ?? 0,
          ) +
            (props.monthlyBudget()?.overBudgetAmount ?? 0) / 2,
        )}
      </p>

      <Show when={props.monthlyBudget()?.overBudgetAmount != 0}>
        <p style="color: red">
          Over budget by ${round(props.monthlyBudget()?.overBudgetAmount ?? 0)}. Splitting
          50/50 -{" "}
          <b>${round((props.monthlyBudget()?.overBudgetAmount ?? 0) / 2)}</b>{" "}
          per person (Total included in above calculation)
        </p>
      </Show>
    </div>
  );
}
