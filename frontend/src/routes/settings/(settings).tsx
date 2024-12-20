import { action, useNavigate, useSearchParams } from "@solidjs/router";
import "./settings.css";
import { createEffect, createResource, createSignal, onMount } from "solid-js";
import { getMonthlyBudget, MonthlyBudget } from "~/monthlyBudget";
import log from "~/logger";
import axios from "axios";
import { loadConfig } from "~/config";
import MonthsDropDown from "~/components/monthsDropDown";
import ErrorComponent from "~/components/errorComponent";

export default function () {
  const [searchParam, _setSearchParam] = useSearchParams();
  const [searchParamSignal, _setSearchParamSignal] = createSignal(searchParam);
  const [monthlyBudget, setMonthlyBudget] = createSignal<MonthlyBudget | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);
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

  createResource(
    () => [searchParamSignal().year, searchParamSignal().month],
    async () => {
      log.info(`Fetching budget for month ${searchParamSignal().month}`);
      setMonthlyBudget(
        await getMonthlyBudget(
          searchParamSignal().year as string,
          searchParamSignal().month as string,
        ),
      );
    },
  );

  createEffect(() => {
    if (!monthlyBudget()) {
      return;
    }
    log.info(
      `Updating monthly budget in backend: ${JSON.stringify(monthlyBudget(), null, 3)}`,
    );
    axios.post(
      `${loadConfig().backendUrl}/budget/${searchParam.year}/${searchParam.month}`,
      monthlyBudget(),
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      },
    );
  });

  const handleSubmission = action(async () => {
    setErrorMessage(null);
    log.info(`Form submitted`);
    log.info(`Shawn contribution: ${shawnContribution()}`);
    log.info(`maggie contribution: ${maggieContribution()}`);

    if (shawnContribution() + maggieContribution() != 100) {
      setErrorMessage("Ah no, the contributions does not add up to 100%...");
      return;
    }

    setMonthlyBudget((prev) => {
      if (!prev) return null;
      const updated = {
        ...prev,
        budget: {
          ...prev.budget,
          shawn_percentage_allocation: shawnContribution(),
          maggie_percentage_allocation: maggieContribution(),
        },
      };
      log.info(`Updating monthly budget: ${JSON.stringify(updated)}`);
      return updated;
    });
    //   console.log(`submitted: ${data}`);
    //   console.log(`shawn: ${data.get("shawn-contribution")}`);
  }, "settings-form");

  return (
    <>
      <span class="inline-flex-container">
        <MonthsDropDown />
        <button
          class="button"
          onClick={() => {
            navigate("/", { replace: true });
          }}
        >
          Home
        </button>
      </span>
      <div id="settings-form">
        <h2>Budget allocation</h2>
        {
          // <Show when={props.monthlyBudget()?.carriedOverFrom}>
          //   <p>Settings carried over from {props.monthlyBudget()?.carriedOverFrom}</p>
          // </Show>
        }
        <ErrorComponent message={errorMessage()} />
        <form action={handleSubmission} method="post">
          {
            // <EditSaveButton />
          }
          <label for="month-budget">Month's budget($)</label>
          <input
            type="number"
            id="month-budget"
            name="month-budget"
            placeholder="1000"
            value={totalBudget()}
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
