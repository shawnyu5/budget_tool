import { AccessorWithLatest } from "@solidjs/router";
import "./monthlySpending.css";
import { Resource, Suspense } from "solid-js";
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
  return (
    <div id="monthly-budget" class="container">
      <p>Remaining:</p>
      {
        // TODO: color should be dynamic, based on if we are over budget or not
      }
      <h1 style="color: green">${props.monthlyBudget()?.totalSpending}</h1>
      <h1>/${props.monthlyBudget()?.budget.total}</h1>
    </div>
  );
}
