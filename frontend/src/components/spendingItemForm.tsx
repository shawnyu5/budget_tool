import { action } from "@solidjs/router";
import { Accessor, createEffect, createSignal, Setter } from "solid-js";
import { SpendingItem } from "~/server";
import ErrorComponent from "./errorComponent";

/**
 * A form that displays a spending item
 */
export function SpendingItemForm(props: {
  spendingItem: Accessor<SpendingItem | null>;
  onSubmit: (
    updatedSpendingItem: SpendingItem,
    errorMessage: Accessor<string | null>,
    setErrorMessage: Setter<string | null>,
  ) => Promise<void>;
}) {
  const [amount, setAmount] = createSignal(0);
  const [date, setDate] = createSignal("");
  const [description, setDescription] = createSignal("");
  const [notes, setNotes] = createSignal("");
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);

  createEffect(() => {
    setAmount(props.spendingItem()?.amount ?? 0);
    setDate(props.spendingItem()?.date ?? "");
    setDescription(props.spendingItem()?.description ?? "");
    setNotes(props.spendingItem()?.notes ?? "");
  });

  return (
    <form
      id="spending-item"
      method="post"
      action={action(async () => {
        props.onSubmit(
          {
            id: props.spendingItem()?.id ?? "",
            amount: amount(),
            date: date(),
            description: description(),
            notes: notes(),
          },
          errorMessage,
          setErrorMessage,
        );
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
      <textarea
        name="notes"
        style="height: 100px"
        // type="text"
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
