import { action, useNavigate, useSearchParams } from "@solidjs/router";
import "./settings.css";
import {
  createResource,
  createSignal,
  ErrorBoundary,
  Show,
  Suspense,
} from "solid-js";
import log from "~/logger";
import NavBar from "~/components/navBar";
import ErrorComponent from "~/components/errorComponent";
import SuccessComponent from "~/components/successComponent";
import { calculateOtherContribution, calculatePercentage } from "~/utils";
import { Month, SettingsPageDataV2Query } from "~/generated/graphql";
import { FireflySettingsForm } from "./firefly_settings";
import { handleGraphQLClientError, NewGraphQLSDK } from "~/graphql";
import Decimal from "decimal.js";

export default function Settings() {
  const [searchParam, _setSearchParam] = useSearchParams();
  const [searchParamSignal, _setSearchParamSignal] = createSignal(searchParam);
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);
  const [successMessage, setSuccessMessage] = createSignal<string | null>(null);
  const graphqlsdk = NewGraphQLSDK();
  const navigate = useNavigate();
  const rawResource = createResource(
    () => [searchParamSignal().year, searchParamSignal().month],
    async () => {
      if (!searchParamSignal().year || !searchParamSignal().month) {
        return;
      }
      log.info(`Fetching settings for month ${searchParamSignal().month}`);
      try {
        const settingsPageData = await graphqlsdk.SettingsPageDataV2({
          year: parseInt(searchParamSignal().year as string),
          month: searchParamSignal().month as Month,
        });

        // If fetching is successful, make sure the error message is gone
        setErrorMessage(null);
        log.info(`Data: ${JSON.stringify(settingsPageData, null, 3)}`);
        return transformSettingsPageData(settingsPageData);
      } catch (e: any) {
        if (e.response?.data) {
          log.warn("Received partial data with errors", e.response.errors);
          setErrorMessage(
            "Failed to load Firefly data. Showing partial results",
          );

          console.log(e.response.data);
          return transformSettingsPageData(e.response.data);
        }
        handleGraphQLClientError(e, navigate);
      }
    },
  );
  const [settingsPageDataResource, { mutate }] = rawResource;

  const onSubmit = action(async () => {
    setErrorMessage(null);
    log.info(`Form submitted`);

    // Maggie % contribution
    const maggie =
      settingsPageDataResource()?.monthSettingsV2.settings
        .maggiePercentageAllocation ?? new Decimal(0);
    // Shawn % contribution
    const shawn =
      settingsPageDataResource()?.monthSettingsV2.settings
        .shawnPercentageAllocation ?? new Decimal(0);

    if (!maggie.plus(shawn).eq(100)) {
      setErrorMessage(
        "Ah oh, the contribution amounts does not add up to 100%...",
      );
      return;
    }

    try {
      await graphqlsdk.UpdateSettings({
        inputs: {
          year: Number(searchParam.year),
          month: searchParam.month as Month,
          settings: {
            totalAllocation:
              settingsPageDataResource()?.monthSettingsV2.settings
                .totalAllocation ?? new Decimal(0),
            shawnPercentageAllocation:
              settingsPageDataResource()?.monthSettingsV2.settings
                .shawnPercentageAllocation ?? new Decimal(0),
            shawnContributionAmount:
              settingsPageDataResource()?.monthSettingsV2.settings
                .shawnContributionAmount ?? new Decimal(0),
            maggiePercentageAllocation:
              settingsPageDataResource()?.monthSettingsV2.settings
                .maggiePercentageAllocation ?? new Decimal(0),
            maggieContributionAmount:
              settingsPageDataResource()?.monthSettingsV2.settings
                .maggieContributionAmount ?? new Decimal(0),
            firefly: {
              ...settingsPageDataResource()?.monthSettingsV2.settings.firefly,
              enabled:
                settingsPageDataResource()?.monthSettingsV2.settings.firefly
                  ?.enabled ?? false,
              apiKey:
                settingsPageDataResource()?.monthSettingsV2.settings.firefly
                  ?.apiKey,
              sourceAccount:
                settingsPageDataResource()?.monthSettingsV2.settings.firefly
                  ?.sourceAccount,
            },
          },
        },
      });
    } catch (e) {
      handleGraphQLClientError(e, navigate, setErrorMessage);
      return;
    }

    setSuccessMessage("Settings updated successfully!");
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
                value={(
                  settingsPageDataResource()?.monthSettingsV2.settings
                    .totalAllocation ?? new Decimal(0)
                ).toFixed(2)}
                onChange={(e) => {
                  const input = (e.target as HTMLInputElement).value;
                  mutate((prev) => {
                    if (!prev) return prev;
                    return {
                      ...prev,
                      monthlyBudgetConfig: {
                        ...prev?.monthSettingsV2.settings,
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
                value={(
                  settingsPageDataResource()?.monthSettingsV2.settings
                    .shawnPercentageAllocation ?? new Decimal(0)
                ).toNumber()}
                onChange={(e) => {
                  const input = e.target as HTMLInputElement;
                  if (!input.value.trim()) return;
                  const shawnPercentageContribution = new Decimal(input.value);
                  const maggiePercentageAllocation = new Decimal(100).minus(
                    shawnPercentageContribution,
                  );
                  mutate((prev) => {
                    if (!prev) return prev;
                    return {
                      ...prev,
                      monthSettingsV2: {
                        settings: {
                          ...prev.monthSettingsV2.settings,
                          shawnPercentageAllocation:
                            shawnPercentageContribution,
                          shawnContributionAmount: calculatePercentage(
                            settingsPageDataResource()?.monthSettingsV2.settings
                              .totalAllocation ?? new Decimal(0),
                            shawnPercentageContribution,
                          ),
                          maggiePercentageAllocation:
                            maggiePercentageAllocation,
                          maggieContributionAmount: calculatePercentage(
                            settingsPageDataResource()?.monthSettingsV2.settings
                              .totalAllocation ?? new Decimal(0),
                            maggiePercentageAllocation,
                          ),
                        },
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
                placeholder="50.00"
                value={(
                  settingsPageDataResource()?.monthSettingsV2.settings
                    .shawnContributionAmount ?? new Decimal(0)
                ).toFixed(2)}
                onChange={(e) => {
                  const input = e.target as HTMLInputElement;
                  if (!input.value.trim()) return;

                  const shawnContributionAmount = new Decimal(input.value);
                  const maggieContributionAmount = calculateOtherContribution(
                    shawnContributionAmount,
                    settingsPageDataResource()?.monthSettingsV2.settings
                      .shawnPercentageAllocation ?? new Decimal(0),
                    settingsPageDataResource()?.monthSettingsV2.settings
                      .maggiePercentageAllocation ?? new Decimal(0),
                  );

                  mutate((prev) => {
                    if (!prev) return prev;
                    return {
                      ...prev,
                      monthSettingsV2: {
                        settings: {
                          ...prev.monthSettingsV2.settings,
                          totalAllocation: maggieContributionAmount.plus(
                            shawnContributionAmount,
                          ),
                          maggieContributionAmount,
                          shawnContributionAmount,
                        },
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
                value={(
                  settingsPageDataResource()?.monthSettingsV2.settings
                    .maggiePercentageAllocation ?? new Decimal(0)
                ).toNumber()}
                onChange={(e) => {
                  const input = e.target as HTMLInputElement;
                  if (!input.value.trim()) return;
                  const contribution = new Decimal(input.value);
                  const shawnPercentageAllocation = new Decimal(100).minus(
                    contribution,
                  );
                  mutate((prev) => {
                    if (!prev) return prev;

                    return {
                      ...prev,
                      monthSettingsV2: {
                        settings: {
                          ...prev.monthSettingsV2.settings,
                          maggiePercentageAllocation: contribution,
                          maggieContributionAmount: calculatePercentage(
                            settingsPageDataResource()?.monthSettingsV2.settings
                              .totalAllocation ?? new Decimal(0),
                            contribution,
                          ),
                          shawnPercentageAllocation: shawnPercentageAllocation,
                          shawnContributionAmount: calculatePercentage(
                            settingsPageDataResource()?.monthSettingsV2.settings
                              .totalAllocation ?? new Decimal(0),
                            shawnPercentageAllocation,
                          ),
                        },
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
                value={(
                  settingsPageDataResource()?.monthSettingsV2.settings
                    .maggieContributionAmount ?? new Decimal(0)
                ).toFixed(2)}
                onChange={(e) => {
                  const input = e.target as HTMLInputElement;
                  if (!input.value.trim()) return;

                  const maggieContributionAmount = new Decimal(input.value);
                  const mPct =
                    settingsPageDataResource()?.monthSettingsV2.settings
                      .maggiePercentageAllocation ?? new Decimal(0);
                  const sPct =
                    settingsPageDataResource()?.monthSettingsV2.settings
                      .shawnPercentageAllocation ?? new Decimal(0);

                  const shawnContributionAmount = calculateOtherContribution(
                    maggieContributionAmount,
                    mPct,
                    sPct,
                  );

                  mutate((prev) => {
                    if (!prev) return prev;
                    console.log("Mutating");

                    let a = {
                      ...prev,
                      monthSettingsV2: {
                        settings: {
                          ...prev.monthSettingsV2.settings,
                          totalAllocation: maggieContributionAmount.plus(
                            shawnContributionAmount,
                          ),
                          maggieContributionAmount,
                          shawnContributionAmount,
                        },
                      },
                    };
                    return a;
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

/**
 * Transform settings page graphql to proper types
 */
function transformSettingsPageData(data: SettingsPageDataV2Query) {
  return {
    ...data,
    monthSettingsV2: {
      settings: {
        ...data.monthSettingsV2.settings,
        maggieContributionAmount: new Decimal(
          data.monthSettingsV2.settings.maggieContributionAmount,
        ),
        maggiePercentageAllocation: new Decimal(
          data.monthSettingsV2.settings.maggiePercentageAllocation,
        ),
        shawnPercentageAllocation: new Decimal(
          data.monthSettingsV2.settings.shawnPercentageAllocation,
        ),
        shawnContributionAmount: new Decimal(
          data.monthSettingsV2.settings.shawnContributionAmount,
        ),
        totalAllocation: new Decimal(
          data.monthSettingsV2.settings.totalAllocation,
        ),
      },
    },
  } satisfies SettingsPageDataV2Query;
}
