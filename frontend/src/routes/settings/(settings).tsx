import { action, useNavigate, useSearchParams } from "@solidjs/router";
import "./settings.css";
import { createEffect, createResource, createSignal, Show } from "solid-js";
import { getMonthlyBudget, MonthlyBudget, updateMonthlyBudget } from "~/server";
import log from "~/logger";
import axios from "axios";
import { loadConfig } from "~/config";
import MonthsDropDown from "~/components/monthsDropDown";
import ErrorComponent from "~/components/errorComponent";
import SuccessComponent from "~/components/successComponent";

export default function () {
  const [searchParam, _setSearchParam] = useSearchParams();
  const [searchParamSignal, _setSearchParamSignal] = createSignal(searchParam);
  const [monthlyBudget, setMonthlyBudget] = createSignal<MonthlyBudget | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);
  const [successMessage, setSuccessMessage] = createSignal<string | null>(null);
  const [shawnContribution, setShawnContribution] = createSignal(0);
  const [maggieContribution, setMaggieContribution] = createSignal(0);
  const [totalBudget, setTotalBudget] = createSignal(0);
  const navigate = useNavigate();

  createEffect(() => {
    setShawnContribution(
      monthlyBudget()?.budget.shawn_percentage_allocation ?? 0,
    );
    setMaggieContribution(
      monthlyBudget()?.budget.maggie_percentage_allocation ?? 0,
    );
    setTotalBudget(monthlyBudget()?.budget.total ?? 0);
  });

  const [monthlyBudgetResource] = createResource(
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
    if (!monthlyBudgetResource()) {
      return;
    }
    setMonthlyBudget(monthlyBudgetResource() ?? null);
  });

  createEffect(async () => {
    if (!monthlyBudget() && monthlyBudget() == monthlyBudgetResource()) {
      return;
    }
    log.info(
      `Updating monthly budget in backend: ${JSON.stringify(monthlyBudget(), null, 3)}`,
    );
    try {
       await updateMonthlyBudget(searchParam.year as string, searchParam.month as string, monthlyBudget()!)
      // await axios.post(
      //   `${loadConfig().backendUrl}/budget/${searchParam.year}/${searchParam.month}`,
      //   monthlyBudget(),
      //   {
      //     headers: {
      //       Authorization: `Bearer ${localStorage.getItem("token")}`,
      //     },
      //   },
      // );
    } catch (e) {
      log.error("Failed to update budget: ", e);
      setErrorMessage("Failed to update settings... Please try again later...");
    }
  });

  const handleSubmission = action(async () => {
    setErrorMessage(null);
    log.info(`Form submitted`);
    log.info(`Shawn contribution: ${shawnContribution()}`);
    log.info(`maggie contribution: ${maggieContribution()}`);

    if (shawnContribution() + maggieContribution() != 100) {
      setErrorMessage("Ah oh, the contributions does not add up to 100%...");
      return;
    }

    setMonthlyBudget((prev) => {
      if (!prev) return null;
      const updated = {
        ...prev,
        budget: {
          total: totalBudget(),
          shawn_percentage_allocation: shawnContribution(),
          maggie_percentage_allocation: maggieContribution(),
        },
      };
      log.info(`Updating monthly budget: ${JSON.stringify(updated)}`);
      return updated;
    });

    setSuccessMessage("Settings updated successfully!");
    // Make the success message disappear after a few seconds
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  }, "settings-form");

  return (
    <>
      <span class="inline-flex-container">
        <MonthsDropDown />
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
        <form action={handleSubmission} method="post">
          <label for="month-budget">Month's budget($)</label>
          <input
            type="number"
            id="month-budget"
            name="month-budget"
            placeholder="1000"
            value={totalBudget()}
            onInput={(e: InputEvent) => {
              const input = (e.target as HTMLInputElement).value;
              setTotalBudget(parseFloat(input));
            }}
            required
          />
          <label for="shawn-contribution">Shawn contribution(%):</label>
          <input
            type="number"
            id="shawn-contribution"
            name="shawn-contribution"
            placeholder="50"
            value={shawnContribution()}
            onInput={(e: InputEvent) => {
              const input = e.target as HTMLInputElement;
              const contribution = parseFloat(input.value);
              setShawnContribution(contribution);
            }}
            required
          />

          <label for="maggie-contribution">Maggie contribution(%):</label>
          <input
            type="number"
            id="maggie-contribution"
            placeholder="50"
            name="maggie-contribution"
            value={maggieContribution()}
            onInput={(e: InputEvent) => {
              const input = e.target as HTMLInputElement;
              const contribution = parseFloat(input.value);
              setMaggieContribution(contribution);
            }}
            required
          />
          <button class="submit success button">Submit</button>
        </form>
      </div>
    </>
  );
}
