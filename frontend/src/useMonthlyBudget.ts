// TODO: the create effects in here are not being trigger properly when monthlyBudget signal changes... idk why
import { getMonthlyBudget, MonthlyBudget } from "./monthlyBudget";
import { useSearchParams } from "@solidjs/router";
import {
  Accessor,
  createEffect,
  createResource,
  createSignal,
  Setter,
} from "solid-js";
import log from "./logger";
import axios from "axios";
import { loadConfig } from "./config";

/**
 * Custom hook for getting the current selected month's budget information. Any updates to this value will cause it to sync with the backend server
 * This value is also guaranteed to contain the budget information of the selected time frame
 */
export function useMonthlyBudget(): [
  Accessor<MonthlyBudget | null>,
  Setter<MonthlyBudget | null>,
] {
  const [searchParam] = useSearchParams();
  const [searchParamSignal, _setSearchParamSignal] = createSignal(searchParam);
  const [monthlyBudget, setMonthlyBudget] = createSignal<MonthlyBudget | null>(
    null,
  );
  // const [fetchedBudget, setFetchedBudget] = createSignal<MonthlyBudget | null>(
  //   null,
  // );

  const [monthlyBudgetResource] = createResource(
    () => [searchParamSignal().year, searchParamSignal().month],
    async () => {
      log.info(
        `Fetching budget for year ${searchParamSignal().year}, month ${searchParamSignal().month}`,
      );
      const year = searchParamSignal().year as string;
      const month = searchParamSignal().month as string;
      const fetchedBudget = await getMonthlyBudget(year, month);
      log.info(`Fetched budget: ${JSON.stringify(fetchedBudget, null, 3)}`);
      return fetchedBudget;
    },
    {
      initialValue: null,
    },
  );

  // Populate the budget signal when ever the resource changes
  createEffect(() => {
    if (monthlyBudgetResource.loading) {
      log.info("MonthlyBudget is still loading...");
      return;
    }
    const budget = monthlyBudgetResource() as MonthlyBudget;
    log.info(
      `Updating mothly budget signal with new budget information: ${JSON.stringify(budget, null, 3)}`,
    );
    setMonthlyBudget(budget);
  });

  createEffect(() => {
    if (!monthlyBudget()) {
      return;
    }
    log.info(
      `Updating monthly budget in backend: ${JSON.stringify(monthlyBudget(), null, 3)}`,
    );
    // setMonthlyBudget(monthlyBudget());
    axios.post(
      `${loadConfig().backendUrl}/budget/${searchParam.year}/${searchParam.month}`,
      monthlyBudget(),
    );
  });

  return [monthlyBudget, setMonthlyBudget];
}
