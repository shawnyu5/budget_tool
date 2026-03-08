import { action, useNavigate, useParams } from "@solidjs/router";
import {
  Accessor,
  createEffect,
  createResource,
  createSignal,
  onMount,
  Setter,
  Show,
  Signal,
} from "solid-js";
import ErrorComponent from "./errorComponent";
import { calculatePercentage } from "~/utils";
import { handleGraphQLErrorObject, NewGraphQLSDK } from "~/graphql";
import { BudgetConfig, SpendingItem, Transaction } from "~/generated/graphql";
import { clientOnly } from "@solidjs/start";
const DatePicker = clientOnly(() => import("@rnwonder/solid-date-picker"));
import "@rnwonder/solid-date-picker/dist/style.css";
import { PickerValue } from "@rnwonder/solid-date-picker";
import Decimal from "decimal.js";

/**
 * A form that displays a spending item
 */
export function SpendingItemForm(props: {
  spendingItem: Accessor<SpendingItem | null>;
  onSubmit: (
    transaction: Transaction,
    errorMessageSignal: Signal<string | null>,
  ) => Promise<void>;
}) {
  const param = useParams();
  const year = param.year;
  const month = param.month;

  const [amount, setAmount] = createSignal(0);
  // const [date, setDate] = createSignal("");
  const [description, setDescription] = createSignal("");
  const [notes, setNotes] = createSignal("");
  const [pickerValue, setPickerValue] = createSignal<PickerValue>({
    label: "",
    value: {},
  });

  createEffect(() => {
    console.log(pickerValue().value);
  });

  const errorMessageSignal = createSignal<string | null>(null);
  // Tracks if the form has been submitted or not
  const [formSubmitted, setFormSubmitted] = createSignal(false);
  const [errorMessage, _setErrorMessage] = errorMessageSignal;
  const [budgetConfig] = createResource(async () => {
    const graphql = NewGraphQLSDK();
    let response = await graphql.SpendingItemForm({
      year: parseInt(year),
      // @ts-ignore
      month: month,
    });

    if (response.monthlyBudgetConfig.__typename == "GraphQLErrorObject") {
      const err = handleGraphQLErrorObject(response.monthlyBudgetConfig);
      if (err) {
        throw new Error(err);
      }
    }
    return response.monthlyBudgetConfig as BudgetConfig;
  });
  const shawnSplit = () => {
    if (Number.isNaN(amount())) {
      return 0;
    }

    return calculatePercentage(
      new Decimal(amount()),
      new Decimal(budgetConfig()?.shawnPercentageAllocation ?? 0),
    );
  };

  const maggieSplit = () => {
    if (Number.isNaN(amount())) {
      return 0;
    }

    return calculatePercentage(
      new Decimal(amount()),
      new Decimal(budgetConfig()?.maggiePercentageAllocation ?? 0),
    );
  };

  createEffect(() => {
    setAmount(props.spendingItem()?.amount ?? 0);
    setDescription(props.spendingItem()?.description ?? "");
    setNotes(props.spendingItem()?.notes ?? "");
    setPickerValue({
      value: {
        selected: props.spendingItem()?.date,
      },
      label: "",
    });
  });

  return (
    <form
      id="spending-item"
      method="post"
      action={action(async () => {
        setFormSubmitted(true);
        console.log(`Picker value: ${JSON.stringify(pickerValue())}`);
        props.onSubmit(
          {
            id: props.spendingItem()?.id ?? crypto.randomUUID(),
            amount: new Decimal(amount()),
            date: new Date(pickerValue().value.selected ?? ""),
            description: description(),
            notes: notes(),
          },
          errorMessageSignal,
        );
      })}
    >
      <ErrorComponent errorMessage={errorMessage()} />

      <Show when={props.spendingItem()} fallback={<p>Loading...</p>}>
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
            value={pickerValue}
            setValue={setPickerValue}
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

        <p>Shawn - ${shawnSplit().toString()}</p>
        <p>Maggie - ${maggieSplit().toString()}</p>
      </Show>
    </form>
  );
}
