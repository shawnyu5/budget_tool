import { action, useNavigate, useSearchParams } from "@solidjs/router";
import "./settings.css";
import {
  createResource,
  createSignal,
  ErrorBoundary,
  Show,
  Suspense,
} from "solid-js";
import { getSettingsPageData, updateMonthlyBudgetConfig } from "~/server";
import log from "~/logger";
import NavBar from "~/components/navBar";
import ErrorComponent from "~/components/errorComponent";
import SuccessComponent from "~/components/successComponent";
import { calculatePercentage, calculatePercentageOf, round } from "~/utils";
import { Month } from "~/generated/graphql";
import { FireflySettingsForm } from "./firefly_settings";
import { handleGraphQLErrorObject, NewGraphQLSDK } from "~/graphql";

export default function Settings() {
  const [searchParam, _setSearchParam] = useSearchParams();
  const [searchParamSignal, _setSearchParamSignal] = createSignal(searchParam);
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);
  const [successMessage, setSuccessMessage] = createSignal<string | null>(null);
  // // Whether to show the firefly settings form
  // const [fireflySettingsToggle, setfireFlySettingsToggle] = createSignal(false);
  const graphqlsdk = NewGraphQLSDK();
  const navigate = useNavigate();
  let hasUserModified = false;

  const rawResource = createResource(
    () => [searchParamSignal().year, searchParamSignal().month],
    async () => {
      if (!searchParamSignal().year || !searchParamSignal().month) {
        return;
      }
      log.info(`Fetching settings for month ${searchParamSignal().month}`);
      let settingsPageData = await getSettingsPageData(
        searchParamSignal().year as string,
        searchParamSignal().month as Month,
        navigate,
      );
      // If fetching is successful, make sure the error message is gone
      setErrorMessage(null);
      log.info(JSON.stringify(settingsPageData, null, 3));
      return settingsPageData;
    },
  );
  const [settingsPageDataResource, { mutate }] = rawResource;

  const onSubmit = action(async () => {
    setErrorMessage(null);
    log.info(`Form submitted`);
    if (
      (settingsPageDataResource()?.monthlyBudgetConfig
        .maggiePercentageAllocation ?? 0) +
        (settingsPageDataResource()?.monthlyBudgetConfig
          .shawnPercentageAllocation ?? 0) !=
      100
    ) {
      setErrorMessage(
        "Ah oh, the contribution amounts does not add up to 100%...",
      );
      return;
    }
    try {
      const res = await updateMonthlyBudgetConfig(
        Number(searchParam.year),
        searchParam.month as Month,
        settingsPageDataResource()?.monthlyBudgetConfig!,
        settingsPageDataResource()?.me.firefly!,
        navigate,
      );

      await graphqlsdk.UpdateSettings({
        inputs: {
          year: Number(searchParam.year),
          month: searchParam.month as Month,
          settings: {
            totalAllocation:
              settingsPageDataResource()?.monthlyBudgetConfig.totalAllocation,
            shawnPercentageAllocation:
              settingsPageDataResource()?.monthlyBudgetConfig
                .shawnPercentageAllocation,
            shawnContributionAmount:
              settingsPageDataResource()?.monthlyBudgetConfig
                .shawnContributionAmount,
            maggiePercentageAllocation:
              settingsPageDataResource()?.monthlyBudgetConfig
                .maggiePercentageAllocation,
            maggieContributionAmount:
              settingsPageDataResource()?.monthlyBudgetConfig
                .maggieContributionAmount,
            firefly: {
              ...settingsPageDataResource()?.me.firefly,
              enabled: settingsPageDataResource()?.me.firefly?.enabled ?? false,
              apiKey: settingsPageDataResource()?.me.firefly?.apiKey,
              sourceAccount:
                settingsPageDataResource()?.me.firefly?.sourceAccount,
            },
          },
        },
      });

      if (res.updateMonthlyBudgetConfig.__typename == "GraphQLErrorObject") {
        const err = handleGraphQLErrorObject(res.updateMonthlyBudgetConfig);
        if (err) {
          throw err;
        }
      }
    } catch (e) {
      // @ts-ignore
      log.error("Failed to update settings: ", e);
      setErrorMessage(`Failed to update settings: ${e}`);
      return;
    }

    setSuccessMessage("Settings updated successfully!");
    hasUserModified = false;
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
      <ErrorBoundary fallback={<p>Failed to load settings...</p>}>
        <div id="settings-form">
          <Suspense fallback="Loading...">
            <h2>Budget allocation</h2>
            <ErrorComponent errorMessage={errorMessage()} />
            <Show when={errorMessage() == null && successMessage()}>
              <SuccessComponent message={successMessage()} />
            </Show>
            <form action={onSubmit} method="post">
              <label for="month-budget">Month's budget($)</label>
              <input
                type="number"
                step="0.01"
                id="month-budget"
                name="month-budget"
                disabled
                value={
                  settingsPageDataResource()?.monthlyBudgetConfig
                    .totalAllocation
                }
                onInput={(e: InputEvent) => {
                  hasUserModified = true;
                  const input = (e.target as HTMLInputElement).value;
                  mutate((prev) => {
                    if (!prev) return prev;
                    return {
                      ...prev,
                      monthlyBudgetConfig: {
                        ...prev.monthlyBudgetConfig,
                        totalAllocation: parseFloat(input),
                      },
                    };
                  });
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
                value={
                  settingsPageDataResource()?.monthlyBudgetConfig
                    .shawnPercentageAllocation
                }
                onInput={(e: InputEvent) => {
                  hasUserModified = true;
                  const input = e.target as HTMLInputElement;
                  const shawnPercentageContribution = parseFloat(input.value);
                  const maggiePercentageAllocation =
                    100 - shawnPercentageContribution;
                  // const updated: BudgetConfig = {
                  //   ...settingsPageDataResource()!,
                  //   ...settingsPageDataResource()!,
                  //   shawnPercentageAllocation: shawnPercentageContribution,
                  //   shawnContributionAmount: calculatePercentage(
                  //     settingsPageDataResource()?.totalAllocation ?? 0,
                  //     shawnPercentageContribution,
                  //   ),
                  //   maggiePercentageAllocation: maggiePercentageAllocation,
                  //   maggieContributionAmount: calculatePercentage(
                  //     settingsPageDataResource()?.totalAllocation ?? 0,
                  //     maggiePercentageAllocation,
                  //   ),
                  // };
                  // mutate(updated);
                  mutate((prev) => {
                    if (!prev) return prev;
                    return {
                      ...prev,
                      monthlyBudgetConfig: {
                        ...prev.monthlyBudgetConfig,
                        shawnPercentageAllocation: shawnPercentageContribution,
                        shawnContributionAmount: calculatePercentage(
                          settingsPageDataResource()?.monthlyBudgetConfig
                            .totalAllocation ?? 0,
                          shawnPercentageContribution,
                        ),
                        maggiePercentageAllocation: maggiePercentageAllocation,
                        maggieContributionAmount: calculatePercentage(
                          settingsPageDataResource()?.monthlyBudgetConfig
                            .totalAllocation ?? 0,
                          maggiePercentageAllocation,
                        ),
                      },
                    };
                  });
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
                  settingsPageDataResource()?.monthlyBudgetConfig
                    .shawnContributionAmount ?? 0
                }
                onInput={(e: InputEvent) => {
                  hasUserModified = true;
                  const input = e.target as HTMLInputElement;
                  const shawnContribution = parseFloat(input.value);

                  const totalBudget = calculatePercentageOf(
                    shawnContribution,
                    settingsPageDataResource()?.monthlyBudgetConfig
                      .shawnPercentageAllocation ?? 0,
                  );

                  // const updated: BudgetConfig = {
                  //   ...settingsPageDataResource()!,
                  //   totalAllocation: round(totalBudget),
                  //   maggieContributionAmount: round(
                  //     totalBudget - shawnContribution,
                  //   ),
                  //   shawnContributionAmount: shawnContribution,
                  // };
                  // mutate(updated);
                  mutate((prev) => {
                    if (!prev) return prev;
                    return {
                      ...prev,
                      monthlyBudgetConfig: {
                        ...prev?.monthlyBudgetConfig,
                        totalAllocation: round(totalBudget),
                        maggieContributionAmount: round(
                          totalBudget - shawnContribution,
                        ),
                        shawnContributionAmount: shawnContribution,
                      },
                    };
                  });
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
                value={
                  settingsPageDataResource()?.monthlyBudgetConfig
                    .maggiePercentageAllocation
                }
                onInput={(e: InputEvent) => {
                  hasUserModified = true;
                  const input = e.target as HTMLInputElement;
                  const contribution = parseFloat(input.value);
                  const shawnPercentageAllocation = 100 - contribution;
                  // const updated: BudgetConfig = {
                  //   ...settingsPageDataResource()!,
                  //   maggiePercentageAllocation: contribution,
                  //   maggieContributionAmount: calculatePercentage(
                  //     settingsPageDataResource()?.totalAllocation ?? 0,
                  //     contribution,
                  //   ),
                  //   shawnPercentageAllocation: shawnPercentageAllocation,
                  //   shawnContributionAmount: calculatePercentage(
                  //     settingsPageDataResource()?.totalAllocation ?? 0,
                  //     shawnPercentageAllocation,
                  //   ),
                  // };
                  // mutate(updated);
                  mutate((prev) => {
                    if (!prev) return prev;

                    return {
                      ...prev,
                      monthlyBudgetConfig: {
                        ...prev.monthlyBudgetConfig,
                        maggiePercentageAllocation: contribution,
                        maggieContributionAmount: calculatePercentage(
                          settingsPageDataResource()?.monthlyBudgetConfig
                            .totalAllocation ?? 0,
                          contribution,
                        ),
                        shawnPercentageAllocation: shawnPercentageAllocation,
                        shawnContributionAmount: calculatePercentage(
                          settingsPageDataResource()?.monthlyBudgetConfig
                            .totalAllocation ?? 0,
                          shawnPercentageAllocation,
                        ),
                      },
                    };
                  });
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
                  settingsPageDataResource()?.monthlyBudgetConfig
                    .maggieContributionAmount ?? 0
                }
                onInput={(e: InputEvent) => {
                  hasUserModified = true;

                  const input = e.target as HTMLInputElement;
                  const maggiecontribution = parseFloat(input.value);
                  const totalBudget = calculatePercentageOf(
                    maggiecontribution,
                    settingsPageDataResource()?.monthlyBudgetConfig
                      .maggiePercentageAllocation ?? 0,
                  );

                  // const updated: BudgetConfig = {
                  //   ...settingsPageDataResource()!,
                  //   totalAllocation: round(totalBudget),
                  //   maggieContributionAmount: maggiecontribution,
                  //   shawnContributionAmount: totalBudget - maggiecontribution,
                  // };
                  // mutate(updated);
                  mutate((prev) => {
                    if (!prev) return prev;

                    return {
                      ...prev,
                      monthlyBudgetConfig: {
                        ...prev.monthlyBudgetConfig,
                        totalAllocation: round(totalBudget),
                        maggieContributionAmount: maggiecontribution,
                        shawnContributionAmount:
                          totalBudget - maggiecontribution,
                      },
                    };
                  });
                }}
                required
              />

              <FireflySettingsForm data={rawResource} />
              <button class="submit success button">Submit</button>
            </form>
          </Suspense>
        </div>
      </ErrorBoundary>
    </>
  );
}
