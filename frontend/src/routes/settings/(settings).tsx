import { action, useSearchParams } from "@solidjs/router";
import "./settings.css";
import {
  createEffect,
  createResource,
  createSignal,
  Show,
  Suspense,
} from "solid-js";
import { getMonthlyBudget, MonthlyBudget, updateMonthlyBudget } from "~/server";
import log from "~/logger";
import NavBar from "~/components/navBar";
import ErrorComponent from "~/components/errorComponent";
import SuccessComponent from "~/components/successComponent";

export default function () {
  const [searchParam, _setSearchParam] = useSearchParams();
  const [searchParamSignal, _setSearchParamSignal] = createSignal(searchParam);
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);
  const [successMessage, setSuccessMessage] = createSignal<string | null>(null);
  const [monthlyBudget, setMonthlyBudget] =
    createSignal<MonthlyBudget | null>();

  const [monthlyBudgetResource, { refetch }] = createResource(
    () => [searchParamSignal().year, searchParamSignal().month],
    async () => {
      if (!searchParamSignal().year || !searchParamSignal().month) {
        return;
      }
      log.info(`Fetching budget for month ${searchParamSignal().month}`);
      return await getMonthlyBudget(
        searchParamSignal().year as string,
        searchParamSignal().month as string,
      );
    },
  );

  createEffect(() => {
    if (
      !monthlyBudgetResource() ||
      monthlyBudget() == monthlyBudgetResource()
    ) {
      return;
    }

    log.info(`Updating monthly budget signal: ${monthlyBudgetResource()}`);
    setMonthlyBudget(monthlyBudgetResource() ?? null);
  });

  const handleSubmission = action(async () => {
    setErrorMessage(null);
    log.info(`Form submitted`);
    log.info(
      `Shawn contribution: ${monthlyBudget()?.budget.shawnPercentageAllocation}`,
    );
    log.info(
      `maggie contribution: ${monthlyBudget()?.budget.maggiePercentageAllocation}`,
    );

    if (
      (monthlyBudget()?.budget.maggiePercentageAllocation ?? 0) +
        (monthlyBudget()?.budget.shawnPercentageAllocation ?? 0) !=
      100
    ) {
      setErrorMessage(
        "Ah oh, the contribution amounts does not add up to 100%...",
      );
      return;
    }
    try {
      await updateMonthlyBudget(
        searchParam.year as string,
        searchParam.month as string,
        monthlyBudget()!,
      );
      log.info(
        `Updated budget resource in backend: ${JSON.stringify(monthlyBudget(), null, 3)}`,
      );
    } catch (e) {
      log.error("Failed to update budget: ", e);
      setErrorMessage("Failed to update settings... Please try again later...");
    }

    // setMonthlyBudget((prev) => {
    //   if (!prev) return null;
    //   const updated = {
    //     ...prev,
    //     budget: {
    //       totalAllocation: totalBudget(),
    //       shawn_percentage_allocation: shawnContributionPercent(),
    //       maggie_percentage_allocation: maggieContributionPercent(),
    //     },
    //   };
    //   log.info(`Updating monthly budget: ${JSON.stringify(updated)}`);
    //   return updated;
    // });

    setSuccessMessage("Settings updated successfully!");
    await refetch();
    // Make the success message disappear after a few seconds
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  }, "settings-form");

  return (
    <>
      <span class="inline-flex-container">
        <NavBar />
      </span>
      <div id="settings-form">
        <h2>Budget allocation</h2>
        {
          // <Show when={props.monthlyBudget()?.carriedOverFrom}>
          //   <p>Settings carried over from {props.monthlyBudget()?.carriedOverFrom}</p>
          // </Show>
        }
        <ErrorComponent message={errorMessage()} />
        <Show when={errorMessage() == null && successMessage()}>
          <SuccessComponent message={successMessage()} />
        </Show>
        <Suspense fallback="Loading...">
          <form action={handleSubmission} method="post">
            <label for="month-budget">Month's budget($)</label>
            <input
              type="number"
              step="0.01"
              id="month-budget"
              name="month-budget"
              disabled
              placeholder="1000"
              value={monthlyBudgetResource()?.budget.totalAllocation}
              onInput={(e: InputEvent) => {
                const input = (e.target as HTMLInputElement).value;
                const updated: MonthlyBudget = {
                  ...monthlyBudget()!,
                  budget: {
                    ...monthlyBudget()!.budget,
                    totalAllocation: parseFloat(input),
                  },
                };
                setMonthlyBudget(updated);
                // setTotalBudgetAllocation(parseFloat(input));
              }}
              required
            />
            <label for="shawn-contribution-percentage">
              Shawn contribution percentage:
            </label>
            <input
              type="number"
              id="shawn-contribution-percentage"
              name="shawn-contribution-percentage"
              step="0.01"
              placeholder="50"
              value={monthlyBudgetResource()?.budget.shawnPercentageAllocation}
              onInput={(e: InputEvent) => {
                const input = e.target as HTMLInputElement;
                const percentageContribution = parseFloat(input.value);
                const updated: MonthlyBudget = {
                  ...monthlyBudget()!,
                  budget: {
                    ...monthlyBudget()!.budget,
                    shawnPercentageAllocation: percentageContribution,
                  },
                };
                setMonthlyBudget(updated);
                // setShawnContributionPercent(contribution);
              }}
              required
            />

            <label for="shawn-contribution-amount">
              Shawn contribution amount:
            </label>
            <input
              type="number"
              id="shawn-contribution-amount"
              name="shawn-contribution-amount"
              step="0.01"
              placeholder="50"
              value={
                monthlyBudgetResource()?.budget.shawnContributionAmount ?? 0
              }
              onInput={(e: InputEvent) => {
                const input = e.target as HTMLInputElement;
                const contribution = parseFloat(input.value);
                const updated: MonthlyBudget = {
                  ...monthlyBudget()!,
                  budget: {
                    ...monthlyBudget()!.budget,
                    shawnContributionAmount: contribution,
                  },
                };
                setMonthlyBudget(updated);
                // setShawnContributionAmount(contribution);
              }}
              required
            />

            <hr />

            <label for="maggie-contribution-percentage">
              Maggie contribution percentage:
            </label>
            <input
              type="number"
              id="maggie-contribution-percentage"
              placeholder="50"
              name="maggie-contribution-percentage"
              value={monthlyBudgetResource()?.budget.maggiePercentageAllocation}
              onInput={(e: InputEvent) => {
                const input = e.target as HTMLInputElement;
                const contribution = parseFloat(input.value);
                const updated: MonthlyBudget = {
                  ...monthlyBudget()!,
                  budget: {
                    ...monthlyBudget()!.budget,
                    maggiePercentageAllocation: contribution,
                  },
                };
                setMonthlyBudget(updated);
                // setMaggieContributionPercent(contribution);
              }}
              required
            />

            <label for="maggie-contribution-amount">
              Maggie contribution amount:
            </label>
            <input
              type="number"
              id="maggie-contribution-amount"
              name="maggie-contribution-amount"
              step="0.01"
              placeholder="50"
              value={
                monthlyBudgetResource()?.budget.maggieContributionAmount ?? 0
              }
              onInput={(e: InputEvent) => {
                const input = e.target as HTMLInputElement;
                const contribution = parseFloat(input.value);
                const updated: MonthlyBudget = {
                  ...monthlyBudget()!,
                  budget: {
                    ...monthlyBudget()!.budget,
                    maggieContributionAmount: contribution,
                  },
                };
                setMonthlyBudget(updated);
              }}
              required
            />
            <button class="submit success button">Submit</button>
          </form>
        </Suspense>
      </div>
    </>
  );
}
