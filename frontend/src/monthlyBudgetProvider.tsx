import {
  createContext,
  createSignal,
  Setter,
  Accessor,
  createEffect,
} from "solid-js";
import axios from "axios";
import { loadConfig } from "./config"; // Assume this is a utility to load config
import { getMonthlyBudget, MonthlyBudget } from "./monthlyBudget";
import log from "./logger";
import { useSearchParams } from "@solidjs/router";

export const MonthlyBudgetContext =
  createContext<
    [Accessor<MonthlyBudget | null>, Setter<MonthlyBudget | null>]
  >();

export const MonthlyBudgetProvider = (props: { children: any }) => {
  const [monthlyBudget, setMonthlyBudget] = createSignal<MonthlyBudget | null>(
    null,
  );
  const [searchParam] = useSearchParams();
  const [searchParamSignal, _setSearchParamSignal] = createSignal(searchParam);

  // Fetch budget data when the component mounts (using a resource or similar strategy)
  const fetchMonthlyBudget = async () => {
    log.info(
      `Fetching budget for year ${searchParamSignal().year}, month ${searchParamSignal().month}`,
    );
    const year = searchParamSignal().year as string;
    const month = searchParamSignal().month as string;
    if (!year || !month) {
      return;
    }

    const fetchedBudget = await getMonthlyBudget(year, month);
    log.info(`Fetched budget: ${JSON.stringify(fetchedBudget, null, 3)}`);
    return fetchedBudget;
  };

  // Call this function when needed to sync with the backend
  const syncMonthlyBudget = async (budget: MonthlyBudget) => {
    try {
      await axios.post(
        `${loadConfig().backendUrl}/budget/${searchParam.year}/${searchParam.month}`,
        budget,
      );
    } catch (err) {
      log.error(`Failed to sync monthly budget with backend: ${err}`);
    }
  };

  // Set an effect to watch changes and sync the budget with the backend
  createEffect(() => {
    if (monthlyBudget()) {
      syncMonthlyBudget(monthlyBudget()!); // Ensure budget exists before syncing
    }
  });

  // On mount, fetch the monthly budget
  fetchMonthlyBudget();

  return (
    <MonthlyBudgetContext.Provider value={[monthlyBudget, setMonthlyBudget]}>
      {props.children}
    </MonthlyBudgetContext.Provider>
  );
};
