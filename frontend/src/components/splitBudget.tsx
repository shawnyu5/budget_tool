import Decimal from "decimal.js";
import { createEffect, Resource, Show } from "solid-js";
import { GetHomePageDataV2Query } from "~/generated/graphql";
import { calculatePercentage, round } from "~/utils";

/**
 * The amount each person is responsible to pay, based on the month's budget. Including displaying any amount that is over budget
 */
export default function SplitBudget(props: {
  data: Resource<GetHomePageDataV2Query | undefined>;
}) {
  return (
    <div id="split-budget">
      <p>
        <b>Shawn</b> (
        {(
          props.data()?.homePageV2.settings.shawnPercentageAllocation ??
          new Decimal(0)
        ).toNumber()}
        %): $
        {calculatePercentage(
          (props.data()?.homePageV2.totalSpending ?? new Decimal(0)).minus(
            props.data()?.homePageV2.overSpending ?? new Decimal(0),
          ),
          props.data()?.homePageV2.settings.shawnPercentageAllocation ??
            new Decimal(0),
        )
          .plus(
            (props.data()?.homePageV2.overSpending ?? new Decimal(0)).dividedBy(
              2,
            ),
          )
          .toNumber()
          .toFixed(2)}
      </p>

      <p>
        <b>Maggie</b> (
        {(
          props.data()?.homePageV2.settings.maggiePercentageAllocation ??
          new Decimal(0)
        ).toNumber()}
        %): $
        {calculatePercentage(
          (props.data()?.homePageV2.totalSpending ?? new Decimal(0)).minus(
            props.data()?.homePageV2.overSpending ?? new Decimal(0),
          ),
          props.data()?.homePageV2.settings.maggiePercentageAllocation ??
            new Decimal(0),
        )
          .plus(
            (props.data()?.homePageV2.overSpending ?? new Decimal(0)).dividedBy(
              2,
            ),
          )
          .toNumber()
          .toFixed(2)}
        {
          // {round(
          //   calculatePercentage(
          //     (props.data()?.totalSpending ?? 0) -
          //       (props.data()?.overBudgetAmount ?? 0),
          //     props.data()?.budget?.maggiePercentageAllocation ?? 0,
          //   ) +
          //     (props.data()?.overBudgetAmount ?? 0) / 2,
          // )}
        }
      </p>

      <Show
        when={
          (
            props.data()?.homePageV2.overSpending ?? new Decimal(0)
          ).toNumber() != 0
        }
      >
        <p style="color: red">
          Over budget by $
          {(props.data()?.homePageV2.overSpending ?? new Decimal(0)).toNumber()}
          . Splitting 50/50 -{" "}
          <b>
            $
            {(
              props.data()?.homePageV2.overSpending ?? new Decimal(0)
            ).toNumber() / 2}
          </b>{" "}
          per person (Total included in above calculation)
        </p>
      </Show>
    </div>
  );
}
