import { action, useNavigate, useParams } from "@solidjs/router";
import axios from "axios";
import { createSignal } from "solid-js";
import ErrorComponent from "~/components/errorComponent";
import { loadConfig } from "~/config";
import log from "~/logger";
import {
  getMonthlyBudget,
  MonthlyBudget,
  SpendingItem,
  updateMonthlyBudget,
} from "~/server";

export default function () {
  const params = useParams();
  const year = params.year;
  const month = params.month;
  const navigate = useNavigate();
  const jsDate = new Date();

  const [id, setID] = createSignal("");
  const [amount, setAmount] = createSignal(0);
  const [date, setDate] = createSignal(
    `${jsDate.getFullYear()}/${jsDate.getMonth() + 1}/${jsDate.getDate()}`,
  );
  const [description, setDescription] = createSignal("");
  const [notes, setNotes] = createSignal("");
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);

  // TODO: should refactor this into a reusable component
  return (
    <form
      id="spending-item"
      method="post"
      action={action(async () => {
        if (errorMessage()) {
          log.info(
            "There is an error message on screen. Not submitting form...",
          );
          return;
        }
        log.info("Submitting form");
        try {
          const monthlyBudget = await getMonthlyBudget(year, month);
          const newSpendingItem: SpendingItem = {
            id: new Date().toString(),
            amount: amount(),
            description: description(),
            date: date(),
            notes: notes(),
          };

          const updatedBudget: MonthlyBudget = {
            ...monthlyBudget,
            spending: [newSpendingItem, ...monthlyBudget.spending],
          };

          await updateMonthlyBudget(year, month, updatedBudget);
        } catch (e) {
          log.error("Failed to update budget: ", e);
          setErrorMessage(`Failed to update budget: ${e}`);
        }
        navigate("/", { replace: true });
      })}
    >
      <ErrorComponent message={errorMessage()} />

      <label>Amount ($)</label>
      <input
        name="amount"
        type="number"
        required
        onInput={(e: InputEvent) => {
          const input = (e.target as HTMLInputElement).value;
          setAmount(parseFloat(input));
        }}
      />

      <label>Date</label>
      <input
        name="date"
        type="text"
        required
        value={date()}
        onInput={(e: InputEvent) => {
          const input = (e.target as HTMLInputElement).value;
          setDate(input);
        }}
      />

      <label>Description</label>
      <input
        name="description"
        type="text"
        required
        value={description()}
        onInput={(e: InputEvent) => {
          const input = (e.target as HTMLInputElement).value;
          setDescription(input);
        }}
      />

      <label>Notes</label>
      <input
        name="notes"
        type="text"
        value={notes()}
        onInput={(e: InputEvent) => {
          const input = (e.target as HTMLInputElement).value;
          setNotes(input);
        }}
      />

      <button class="button success" type="submit">
        Add
      </button>
    </form>
  );
}
