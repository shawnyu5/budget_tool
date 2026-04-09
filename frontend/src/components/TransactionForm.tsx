import { action, useParams } from "@solidjs/router";
import { createEffect, createSignal, Resource, Show, Signal } from "solid-js";
import ErrorComponent from "./errorComponent";
import { calculatePercentage, formatRfc3339DateObj } from "~/utils";
import { Transaction } from "~/generated/graphql";
import { clientOnly } from "@solidjs/start";
const DatePicker = clientOnly(() => import("@rnwonder/solid-date-picker"));
import "@rnwonder/solid-date-picker/dist/style.css";
import { PickerValue } from "@rnwonder/solid-date-picker";
import Decimal from "decimal.js";

/**
 * A form that displays a transaction
 */
export function TransactionForm(props: {
  transaction?: Resource<Transaction | undefined>;
  onSubmit: (
    transaction: Transaction,
    errorMessageSignal: Signal<string | null>,
  ) => Promise<void>;
}) {
  const [amount, setAmount] = createSignal<string>();
  const [description, setDescription] = createSignal("");
  const [notes, setNotes] = createSignal("");
  const [datePicker, setDatePicker] = createSignal<PickerValue>({
    label: "",
    value: {},
  });

  const errorMessageSignal = createSignal<string | null>(null);
  // Tracks if the form has been submitted or not
  const [formSubmitted, setFormSubmitted] = createSignal(false);
  const [errorMessage, _setErrorMessage] = errorMessageSignal;

  createEffect(() => {
    const tx = props.transaction?.();
    if (tx) {
      setAmount(tx.amount.toString());
      setDescription(tx.description);
      setNotes(tx.notes);
      setDatePicker({
        value: {
          selected: formatRfc3339DateObj(tx.date ?? new Date()),
        },
        label: "",
      });
    } else {
      setDatePicker({
        value: {
          selected: formatRfc3339DateObj(new Date()),
        },
        label: "",
      });
    }
  });

  return (
    <form
      id="spending-item"
      method="post"
      action={action(async () => {
        setFormSubmitted(true);
        props.onSubmit(
          {
            id: props.transaction?.()?.id ?? crypto.randomUUID(),
            amount: new Decimal(amount() ?? "0"),
            date: new Date(datePicker().value.selected ?? ""),
            description: description(),
            notes: notes(),
          } satisfies Transaction,
          errorMessageSignal,
        );
      })}
    >
      <ErrorComponent errorMessage={errorMessage()} />

      <Show when={!props.transaction?.loading} fallback={<p>Loading...</p>}>
        <label>Amount ($)</label>
        <input
          name="amount"
          type="number"
          step="0.01"
          required
          value={amount()}
          onInput={(e: InputEvent) => {
            const input = (e.target as HTMLInputElement).value;
            setAmount(input);
          }}
        />

        <label>Date</label>
        {
          // <input
          //   name="date"
          //   type="text"
          //   required
          //   value={date()}
          //   onInput={(e: InputEvent) => {
          //     const input = (e.target as HTMLInputElement).value;
          //     setDate(input);
          //   }}
          // />
          <DatePicker
            type="single"
            value={datePicker}
            setValue={setDatePicker}
          />
        }

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

        <button class="button success" type="submit" disabled={formSubmitted()}>
          Save
        </button>

        {
          // <p>Shawn - ${shawnSplit().toString()}</p>
          // <p>Maggie - ${maggieSplit().toString()}</p>
        }
      </Show>
    </form>
  );
}
