import { AccessorWithLatest } from "@solidjs/router";
import "./monthlySpending.css";
import { createEffect, createSignal, Resource, Suspense } from "solid-js";
import { MonthlyBudget } from "~/server";

/**
 * Displays the monthly spending. Including:
 * - The total budget for the month
 * - The total spending
 * - Amount left in budget
 * -  TODO: over budget amount if any
 */
export default function (props: {
  monthlyBudget: Resource<MonthlyBudget | null>;
}) {
  const remainingBudget = () =>
    (props.monthlyBudget()?.budget.totalAllocation ?? 0) -
    (props.monthlyBudget()?.totalSpending ?? 0);

  const [color, setColor] = createSignal("green");

  createEffect(() => {
    if (remainingBudget() > 0) {
      setColor("green");
    } else {
      setColor("red");
    }
  });

  return (
    <div id="monthly-budget" class="container">
      <p>Remaining:</p>
      <h1 style={{ background: "yellow", color: color() }}>
        ${props.monthlyBudget()?.totalSpending}
      </h1>
      <h1>/${props.monthlyBudget()?.budget.totalAllocation} -&nbsp;</h1>
      <h1 style={{ color: color() }}>${remainingBudget()}</h1>
    </div>
  );
}
