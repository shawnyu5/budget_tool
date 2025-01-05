import { action, useNavigate, useParams } from "@solidjs/router";
import axios from "axios";
import { createSignal, ErrorBoundary, onMount } from "solid-js";
import ErrorComponent from "~/components/errorComponent";
import { loadConfig } from "~/config";
import log from "~/logger";
import { SpendingItem } from "~/server";

export default function () {
  const params = useParams();
  const year = params.year;
  const month = params.month;
  const navigate = useNavigate();

  const [id, setID] = createSignal(params.id);
  const [amount, setAmount] = createSignal(0);
  const [date, setDate] = createSignal("");
  const [description, setDescription] = createSignal("");
  const [notes, setNotes] = createSignal("");
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);

  onMount(async () => {
    try {
      const spendingItem = await axios.get<SpendingItem>(
        `${loadConfig().backendUrl}/spending-item/${year}/${month}/${id()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      setID(spendingItem.data.id);
      setAmount(spendingItem.data.amount);
      setDate(spendingItem.data.date);
      setDescription(spendingItem.data.description);
      setNotes(spendingItem.data.notes ?? "");
    } catch (e) {
      log.error("Failed to get spending information: ", e);
      setErrorMessage(`Failed to get spending information: ${e}`);
    }
  });

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

        const spendingItem: SpendingItem = {
          id: id(),
          amount: amount(),
          date: date(),
          description: description(),
          notes: notes(),
        };
        // TODO: error handling
        const response = await axios.post(
          `${loadConfig().backendUrl}/spending-item/${year}/${month}/${id()}`,
          spendingItem,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );

        navigate("/", { replace: true });
      })}
    >
      <ErrorComponent message={errorMessage()} />

      <label>Amount ($)</label>
      <input
        name="amount"
        type="number"
        step="0.01"
        required
        value={amount()}
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
        Save
      </button>
    </form>
  );
}
