import Decimal from "decimal.js";
import "./monthlySpending.css";
import { createEffect, createSignal, Resource } from "solid-js";
import { GetHomePageDataV2Query, MonthlyBudget } from "~/generated/graphql";
import { round } from "~/utils";

/**
 * Displays the monthly spending. Including:
 * - The total budget for the month
 * - The total spending
 * - Amount left in budget
 * -  TODO: over budget amount if any
 */
export default function (props: {
  data: Resource<GetHomePageDataV2Query | undefined>;
}) {
  const remainingBudget = () =>
    props
      .data()
      ?.homePageV2.totalBudget.minus(
        props.data()?.homePageV2.totalSpending ?? new Decimal(0),
      ) ?? new Decimal(0);
  // const remainingBudget = () =>
  //   round(
  //     (props.data()?.budget?.totalAllocation ?? 0) -
  //       (props.data()?.totalSpending ?? 0),
  //   );
  const [color, setColor] = createSignal("green");

  createEffect(() => {
    if (remainingBudget()?.greaterThan(0)) {
      setColor("green");
    } else {
      setColor("red");
    }
  });

  return (
    <div id="monthly-budget" class="container">
      <p>Spent:</p>
      <h1 style={{ background: "yellow", color: color() }}>
        ${(props.data()?.homePageV2.totalSpending ?? new Decimal(0)).toNumber()}
      </h1>
      <h1>
        /${(props.data()?.homePageV2.totalBudget ?? new Decimal(0)).toNumber()}{" "}
        -&nbsp;
      </h1>
      <h1 style={{ color: color() }}>${remainingBudget().toNumber()}</h1>
    </div>
  );
}
