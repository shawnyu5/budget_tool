import { action, useNavigate, useSearchParams } from "@solidjs/router";
import "./settings.css";
import {
  createEffect,
  createResource,
  createSignal,
  Show,
  Suspense,
} from "solid-js";
import {
  getMonthlyBudget,
  MonthlyBudget,
  MonthlyBudgetErrors,
  updateMonthlyBudget,
} from "~/server";
import log from "~/logger";
import NavBar from "~/components/navBar";
import ErrorComponent from "~/components/errorComponent";
import SuccessComponent from "~/components/successComponent";
import { calculatePercentage, calculatePercentageOf, round } from "~/utils";

export default function () {
  const [searchParam, _setSearchParam] = useSearchParams();
  const [searchParamSignal, _setSearchParamSignal] = createSignal(searchParam);
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);
  const [successMessage, setSuccessMessage] = createSignal<string | null>(null);
  const [monthlyBudget, _setMonthlyBudget] =
    createSignal<MonthlyBudget | null>();
  const navigate = useNavigate();
  let hasUserModified = false;

  const setMonthlyBudget = (monthlyBudget: MonthlyBudget | null) => {
    if (
      (monthlyBudget?.budget.maggiePercentageAllocation ?? 0) +
        (monthlyBudget?.budget.shawnPercentageAllocation ?? 0) !=
      100
    ) {
      setErrorMessage(
        "Ah oh... The percentage allocations does not add up to 100%",
      );
      return;
    }
    setErrorMessage(null);
    _setMonthlyBudget(monthlyBudget);
  };

  const [monthlyBudgetResource, { refetch }] = createResource(
    () => [searchParamSignal().year, searchParamSignal().month],
    async () => {
      if (!searchParamSignal().year || !searchParamSignal().month) {
        return;
      }
      log.info(`Fetching budget for month ${searchParamSignal().month}`);
      try {
        const budget = await getMonthlyBudget(
          searchParamSignal().year as string,
          searchParamSignal().month as string,
        );

        // If fetching is successful, make sure the error message is gone
        setErrorMessage(null);
        return budget;
      } catch (e) {
        if (
          e == MonthlyBudgetErrors.RE_AUTH_NEEDED ||
          e == MonthlyBudgetErrors.FORBIDDEN
        ) {
          navigate("/login", { replace: true });
        } else if (e == MonthlyBudgetErrors.FAILED_TO_FETCH_BUDGET) {
          setErrorMessage("Failed to fetch monthly budget...");
        }
      }
      // return await getMonthlyBudget(
      //   searchParamSignal().year as string,
      //   searchParamSignal().month as string,
      // );
    },
  );

  createEffect(() => {
    if (
      !monthlyBudgetResource() ||
      hasUserModified ||
      monthlyBudget() == monthlyBudgetResource()
    ) {
      return;
    }

    log.info(
      `Updating monthly budget signal: ${JSON.stringify(monthlyBudgetResource(), null, 3)}`,
    );
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
    hasUserModified = false;
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
        <Show when={monthlyBudget()} fallback="Loading...">
          <h2>Budget allocation</h2>
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
                value={monthlyBudget()?.budget.totalAllocation}
                onInput={(e: InputEvent) => {
                  hasUserModified = true;
                  const input = (e.target as HTMLInputElement).value;
                  const updated: MonthlyBudget = {
                    ...monthlyBudget()!,
                    budget: {
                      ...monthlyBudget()!.budget,
                      totalAllocation: parseFloat(input),
                    },
                  };
                  setMonthlyBudget(updated);
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
                value={monthlyBudget()?.budget.shawnPercentageAllocation}
                onInput={(e: InputEvent) => {
                  hasUserModified = true;
                  const input = e.target as HTMLInputElement;
                  const shawnPercentageContribution = parseFloat(input.value);
                  const maggiePercentageAllocation =
                    100 - shawnPercentageContribution;
                  const updated: MonthlyBudget = {
                    ...monthlyBudget()!,
                    budget: {
                      ...monthlyBudget()!.budget,
                      shawnPercentageAllocation: shawnPercentageContribution,
                      shawnContributionAmount: calculatePercentage(
                        monthlyBudget()?.budget.totalAllocation ?? 0,
                        shawnPercentageContribution,
                      ),
                      maggiePercentageAllocation: maggiePercentageAllocation,
                      maggieContributionAmount: calculatePercentage(
                        monthlyBudget()?.budget.totalAllocation ?? 0,
                        maggiePercentageAllocation,
                      ),
                    },
                  };
                  setMonthlyBudget(updated);
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
                value={monthlyBudget()?.budget.shawnContributionAmount ?? 0}
                onInput={(e: InputEvent) => {
                  hasUserModified = true;
                  const input = e.target as HTMLInputElement;
                  const shawnContribution = parseFloat(input.value);

                  const totalBudget = calculatePercentageOf(
                    shawnContribution,
                    monthlyBudget()?.budget.shawnPercentageAllocation ?? 0,
                  );

                  const updated: MonthlyBudget = {
                    ...monthlyBudget()!,
                    budget: {
                      ...monthlyBudget()!.budget,
                      totalAllocation: round(totalBudget),
                      maggieContributionAmount: round(totalBudget - shawnContribution),
                      shawnContributionAmount: shawnContribution,
                    },
                  };
                  setMonthlyBudget(updated);
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
                value={monthlyBudget()?.budget.maggiePercentageAllocation}
                onInput={(e: InputEvent) => {
                  hasUserModified = true;
                  const input = e.target as HTMLInputElement;
                  const contribution = parseFloat(input.value);
                  const shawnPercentageAllocation = 100 - contribution;
                  const updated: MonthlyBudget = {
                    ...monthlyBudget()!,
                    budget: {
                      ...monthlyBudget()!.budget,
                      maggiePercentageAllocation: contribution,
                      maggieContributionAmount: calculatePercentage(
                        monthlyBudget()!.budget.totalAllocation,
                        contribution,
                      ),
                      shawnPercentageAllocation: shawnPercentageAllocation,
                      shawnContributionAmount: calculatePercentage(
                        monthlyBudget()?.budget.totalAllocation ?? 0,
                        shawnPercentageAllocation,
                      ),
                    },
                  };
                  setMonthlyBudget(updated);
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
                value={monthlyBudget()?.budget.maggieContributionAmount ?? 0}
                onInput={(e: InputEvent) => {
                  hasUserModified = true;

                  const input = e.target as HTMLInputElement;
                  const maggiecontribution = parseFloat(input.value);
                  const totalBudget = calculatePercentageOf(
                    maggiecontribution,
                    monthlyBudget()?.budget.maggiePercentageAllocation ?? 0,
                  );

                  const updated: MonthlyBudget = {
                    ...monthlyBudget()!,
                    budget: {
                      ...monthlyBudget()!.budget,
                      totalAllocation: round(totalBudget),
                      maggieContributionAmount: maggiecontribution,
                      shawnContributionAmount: totalBudget - maggiecontribution,
                    },
                  };
                  setMonthlyBudget(updated);
                }}
                required
              />
              <button class="submit success button" disabled={!!errorMessage()}>
                Submit
              </button>
            </form>
          </Suspense>
        </Show>
      </div>
    </>
  );
}
