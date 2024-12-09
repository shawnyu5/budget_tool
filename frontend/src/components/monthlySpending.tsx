import "./monthlySpending.css";
import { useSearchParams } from "@solidjs/router";
import { createResource } from "solid-js";
import { getMonthlyBudget, monthlyBudgetType as MonthlyBudget, totalSpending } from "~/monthlyBudget";
/**
 * Displays the monthly spending. Including:
 * - The total budget for the month
 * - The total spending
 * - Amount left in budget
 */
export default function () {
  const [searchParam, _setSearchParam] = useSearchParams();
  const [monthBudget] = createResource(async () => {
    let budget = await getMonthlyBudget(
      searchParam.year as string,
      searchParam.month as string,
    );

    return budget;
  });
  return (
    <>
      <div class="container">
        <p>Remaining:</p>
        {
          // TODO: color should be dynamic, based on the percentage of month left
        }
        <h1 style="color: green">
          ${totalSpending(monthBudget() as MonthlyBudget)}
        </h1>
        <h1>/${monthBudget()?.budget.total}</h1>
      </div>
    </>
  );
}

