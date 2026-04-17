import "./index.css";
import {
  createResource,
  createSignal,
  ErrorBoundary,
  Show,
  Suspense,
} from "solid-js";
import MonthlySpending from "~/components/MonthlySpending";
import BudgetTable from "~/components/BudgetTable";
import { useNavigate, useSearchParams } from "@solidjs/router";
import log from "~/logger";
import SplitBudget from "~/components/SplitBudget";
import ErrorComponent from "~/components/ErrorComponent";
import CustomNavBar from "~/components/NavBar";
import { GetHomePageDataV2Query, Month } from "~/generated/graphql";
import { handleGraphQLClientError, NewGraphQLSDK } from "~/graphql";
import Decimal from "decimal.js";

export default function Home() {
  const [searchParam, _setSearchParam] = useSearchParams();
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);
  const [searchParamSignal, _setSearchParamSignal] = createSignal(searchParam);
  const graphqlSdk = NewGraphQLSDK();
  const navigate = useNavigate();

  const [dataResource, { mutate }] = createResource(
    () => [searchParamSignal().year, searchParamSignal().month],
    async () => {
      if (!searchParamSignal().year || !searchParamSignal().month) {
        return undefined;
      }
      log.info(
        `[Resource] Fetching budget for month ${searchParamSignal().month}`,
      );
      try {
        let response = await graphqlSdk.GetHomePageDataV2({
          inputs: {
            year: parseInt(searchParam.year as string),
            month: searchParam.month as Month,
          },
        });

        let res = {
          ...response,
          homePageV2: {
            ...response.homePageV2,
            overSpending: new Decimal(response.homePageV2.overSpending),
            totalBudget: new Decimal(response.homePageV2.totalBudget),
            totalSpending: new Decimal(response.homePageV2.totalSpending),
            transactions: response.homePageV2.transactions.map(
              (transaction) => {
                return {
                  id: transaction.id,
                  amount: new Decimal(transaction.amount),
                  date: new Date(transaction.date),
                  description: transaction.description,
                  notes: transaction.notes,
                };
              },
            ),
            settings: {
              ...response.homePageV2.settings,
              maggieContributionAmount: new Decimal(
                response.homePageV2.settings.maggieContributionAmount,
              ),
              maggiePercentageAllocation: new Decimal(
                response.homePageV2.settings.maggiePercentageAllocation,
              ),
              shawnPercentageAllocation: new Decimal(
                response.homePageV2.settings.shawnPercentageAllocation,
              ),
              shawnContributionAmount: new Decimal(
                response.homePageV2.settings.shawnContributionAmount,
              ),
              totalAllocation: new Decimal(
                response.homePageV2.settings.totalAllocation,
              ),
            },
          },
        } satisfies GetHomePageDataV2Query;
        return res;
      } catch (e) {
        handleGraphQLClientError(e, navigate);
      }
    },
  );

  return (
    <main>
      <CustomNavBar />
      <ErrorBoundary fallback={<p>Failed to load budget</p>}>
        <Suspense fallback={<p>Loading...</p>}>
          <Show when={dataResource()}>
            {(_data) => (
              <div id="body">
                <span class="flex flex-col">
                  <Show when={Notification.permission === "denied"}>
                    <ErrorComponent errorMessage="This app needs to send notifications! Some functionality may not work properly without this permission" />
                  </Show>
                </span>
                <ErrorComponent errorMessage={errorMessage()} />
                <MonthlySpending data={dataResource} />
                <SplitBudget data={dataResource} />
                <br />
                <BudgetTable
                  data={dataResource}
                  setErrorMessage={setErrorMessage}
                  mutate={mutate}
                />
              </div>
            )}
          </Show>
        </Suspense>
      </ErrorBoundary>
    </main>
  );
}
