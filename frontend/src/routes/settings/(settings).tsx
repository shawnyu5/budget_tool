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
import CustomNavBar from "~/components/navBar";
import ErrorComponent from "~/components/errorComponent";
import SuccessComponent from "~/components/successComponent";
import { calculateOtherContribution, calculatePercentage } from "~/utils";
import { Month, SettingsPageDataV2Query } from "~/generated/graphql";
import { FireflySettingsForm } from "./firefly_settings";
import { handleGraphQLClientError, NewGraphQLSDK } from "~/graphql";
import Decimal from "decimal.js";
import { Button, Form, InputGroup } from "solid-bootstrap";

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
        <CustomNavBar />
      </span>
      <ErrorBoundary fallback={<p>Failed to load settings...</p>}>
        <div id="settings-form">
          <Suspense fallback="Loading...">
            <h2>Budget allocation</h2>
            <ErrorComponent errorMessage={errorMessage()} />
            <Show when={errorMessage() == null && successMessage()}>
              <SuccessComponent message={successMessage()} />
            </Show>
            <Form action={onSubmit} method="post">
              <Form.Group controlId="month-budget">
                <Form.Label>Month's budget($)</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  name="month-budget"
                  disabled // Note: onChange won't fire while disabled
                  required
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
                />
                <Form.Text datatype="number" class="text-muted"></Form.Text>
                <Form.Group
                  controlId="shawn-contribution-percentage"
                  class="mb-3"
                >
                  <Form.Label>Shawn contribution percentage:</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="number"
                      step="0.01"
                      placeholder="50"
                      required
                      value={(
                        settingsPageDataResource()?.monthSettingsV2.settings
                          .shawnPercentageAllocation ?? new Decimal(0)
                      ).toNumber()}
                      onInput={(e) => {
                        const val = e.currentTarget.value;
                        if (!val.trim()) return;

                        const shawnPercentage = new Decimal(val);
                        const maggiePercentage = new Decimal(100).minus(
                          shawnPercentage,
                        );
                        const totalAlloc =
                          settingsPageDataResource()?.monthSettingsV2.settings
                            .totalAllocation ?? new Decimal(0);

                        mutate((prev) => {
                          if (!prev) return prev;
                          return {
                            ...prev,
                            monthSettingsV2: {
                              ...prev.monthSettingsV2,
                              settings: {
                                ...prev.monthSettingsV2.settings,
                                shawnPercentageAllocation: shawnPercentage,
                                maggiePercentageAllocation: maggiePercentage,
                                shawnContributionAmount: calculatePercentage(
                                  totalAlloc,
                                  shawnPercentage,
                                ),
                                maggieContributionAmount: calculatePercentage(
                                  totalAlloc,
                                  maggiePercentage,
                                ),
                              },
                            },
                          };
                        });
                      }}
                    />
                    <InputGroup.Text>%</InputGroup.Text>
                  </InputGroup>
                </Form.Group>

                <Form.Group controlId="shawn-contribution-amount" class="mb-3">
                  <Form.Label>Shawn contribution amount:</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>$</InputGroup.Text>
                    <Form.Control
                      type="number"
                      step="0.01"
                      placeholder="50.00"
                      required
                      value={(
                        settingsPageDataResource()?.monthSettingsV2.settings
                          .shawnContributionAmount ?? new Decimal(0)
                      ).toFixed(2)}
                      onInput={(e) => {
                        const val = e.currentTarget.value;
                        if (!val.trim()) return;

                        const shawnAmt = new Decimal(val);
                        const settings =
                          settingsPageDataResource()?.monthSettingsV2.settings;

                        // Calculate the corresponding amount for Maggie based on current split
                        const maggieAmt = calculateOtherContribution(
                          shawnAmt,
                          settings?.shawnPercentageAllocation ?? new Decimal(0),
                          settings?.maggiePercentageAllocation ??
                            new Decimal(0),
                        );

                        mutate((prev) => {
                          if (!prev) return prev;
                          return {
                            ...prev,
                            monthSettingsV2: {
                              ...prev.monthSettingsV2,
                              settings: {
                                ...prev.monthSettingsV2.settings,
                                shawnContributionAmount: shawnAmt,
                                maggieContributionAmount: maggieAmt,
                                totalAllocation: shawnAmt.plus(maggieAmt),
                              },
                            },
                          };
                        });
                      }}
                    />
                  </InputGroup>
                </Form.Group>
                <hr />

                <Form.Group
                  controlId="maggie-contribution-percentage"
                  class="mb-3"
                >
                  <Form.Label>Maggie contribution percentage:</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="number"
                      step="0.01"
                      placeholder="50"
                      required
                      value={(
                        settingsPageDataResource()?.monthSettingsV2.settings
                          .maggiePercentageAllocation ?? new Decimal(0)
                      ).toNumber()}
                      onInput={(e) => {
                        const val = e.currentTarget.value;
                        if (!val.trim()) return;

                        const contribution = new Decimal(val);
                        const shawnPercentage = new Decimal(100).minus(
                          contribution,
                        );
                        const totalAlloc =
                          settingsPageDataResource()?.monthSettingsV2.settings
                            .totalAllocation ?? new Decimal(0);

                        mutate((prev) => {
                          if (!prev) return prev;
                          return {
                            ...prev,
                            monthSettingsV2: {
                              ...prev.monthSettingsV2,
                              settings: {
                                ...prev.monthSettingsV2.settings,
                                maggiePercentageAllocation: contribution,
                                maggieContributionAmount: calculatePercentage(
                                  totalAlloc,
                                  contribution,
                                ),
                                shawnPercentageAllocation: shawnPercentage,
                                shawnContributionAmount: calculatePercentage(
                                  totalAlloc,
                                  shawnPercentage,
                                ),
                              },
                            },
                          };
                        });
                      }}
                    />
                    <InputGroup.Text>%</InputGroup.Text>
                  </InputGroup>
                </Form.Group>
                <Form.Group controlId="maggie-contribution-amount" class="mb-3">
                  <Form.Label>Maggie contribution amount:</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>$</InputGroup.Text>
                    <Form.Control
                      type="number"
                      step="0.01"
                      placeholder="50.00"
                      required
                      value={(
                        settingsPageDataResource()?.monthSettingsV2.settings
                          .maggieContributionAmount ?? new Decimal(0)
                      ).toFixed(2)}
                      onInput={(e) => {
                        const val = e.currentTarget.value;
                        if (!val.trim()) return;

                        const maggieAmt = new Decimal(val);
                        const settings =
                          settingsPageDataResource()?.monthSettingsV2.settings;
                        const mPct =
                          settings?.maggiePercentageAllocation ??
                          new Decimal(0);
                        const sPct =
                          settings?.shawnPercentageAllocation ?? new Decimal(0);

                        const shawnAmt = calculateOtherContribution(
                          maggieAmt,
                          mPct,
                          sPct,
                        );

                        mutate((prev) => {
                          if (!prev) return prev;
                          return {
                            ...prev,
                            monthSettingsV2: {
                              ...prev.monthSettingsV2,
                              settings: {
                                ...prev.monthSettingsV2.settings,
                                totalAllocation: maggieAmt.plus(shawnAmt),
                                maggieContributionAmount: maggieAmt,
                                shawnContributionAmount: shawnAmt,
                              },
                            },
                          };
                        });
                      }}
                    />
                  </InputGroup>
                </Form.Group>
                <FireflySettingsForm data={rawResource} />
                <Button variant="success" type="submit">
                  Submit
                </Button>
              </Form.Group>
            </Form>
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
