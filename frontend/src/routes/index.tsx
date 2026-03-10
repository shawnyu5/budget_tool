import "./index.css";
import {
  createEffect,
  createResource,
  createSignal,
  ErrorBoundary,
  Show,
  Suspense,
} from "solid-js";
import MonthlySpending from "~/components/monthlySpending";
import BudgetTable from "~/components/budgetTable";
import { useNavigate, useSearchParams } from "@solidjs/router";
import log from "~/logger";
import SplitBudget from "~/components/splitBudget";
import ErrorComponent from "~/components/errorComponent";
import NavBar from "~/components/navBar";
import {
  GetHomePageDataV2Query,
  Month,
  MonthlyBudget,
} from "~/generated/graphql";
import {
  handleGraphQLClientError,
  handleGraphQLErrorObject,
  NewGraphQLSDK,
} from "~/graphql";
import Decimal from "decimal.js";

export default function Home() {
  const [searchParam, _setSearchParam] = useSearchParams();
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);
  const [searchParamSignal, _setSearchParamSignal] = createSignal(searchParam);
  const graphqlSdk = NewGraphQLSDK();

  /**
   * Update the budget resource
   * @param budget - the new budget
   */
  // function setMonthlyBudget(budget: MonthlyBudget) {
  //   log.info("Mutating monthly budget");
  //   mutate(budget);
  // }

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
                console.log(
                  `description: ${transaction.description} - date: ${transaction.date}`,
                );
                const d = new Date(transaction.date);
                // __AUTO_GENERATED_PRINT_VAR_START__
                console.log(
                  "custom print var Home#(anon)#(anon) d: %s",
                  JSON.stringify(d),
                ); // __AUTO_GENERATED_PRINT_VAR_END__
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
      <NavBar />
      <ErrorBoundary fallback={<p>Failed to load budget</p>}>
        <Suspense fallback={<p>Loading...</p>}>
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
            mutate={mutate}
            // setMonthlyBudget={setMonthlyBudget}
          />
        </Suspense>
      </ErrorBoundary>
    </main>
  );
}
