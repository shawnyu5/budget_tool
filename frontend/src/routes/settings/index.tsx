import { action } from "@solidjs/router";
import "./index.css";
import MonthsDropDown from "~/components/monthsDropDown";
import { createSignal } from "solid-js";

export default function () {
  const [settings, setSettings] = createSignal("");

  return (
    <>
      {
        // <MonthsDropDown />
      }
      <div id="settings-form">
        <h2>Budget allocation</h2>
        {
          // <Show when={props.monthlyBudget()?.carriedOverFrom}>
          //   <p>Settings carried over from {props.monthlyBudget()?.carriedOverFrom}</p>
          // </Show>
        }
        <form action={handleSubmission} method="post">
          <label for="month-budget">Month's budget($)</label>
          <input
            type="number"
            id="month-budget"
            name="month-budget"
            placeholder="1000"
            required
          />
          <label for="shawn-contribution">Shawn contribution(%):</label>
          <input
            type="number"
            id="shawn-contribution"
            name="shawn-contribution"
            placeholder="50"
            required
          />

          <label for="maggie-contribution">Maggie contribution(%):</label>
          <input
            type="number"
            id="maggie-contribution"
            placeholder="50"
            name="maggie-contribution"
            value={settings()}
            required
          />
          <button type="submit">Submit</button>
        </form>
      </div>
    </>
  );
}

const handleSubmission = action(async (data: FormData) => {
  console.log(`submitted: ${data}`);
  console.log(`shawn: ${data.get("shawn-contribution")}`);
}, "settings-form");
