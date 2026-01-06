import { action, Navigate, useNavigate, useParams } from "@solidjs/router";
import {
  Accessor,
  createEffect,
  createResource,
  createSignal,
  Setter,
  Show,
} from "solid-js";
import { SpendingItem } from "~/server";
import ErrorComponent from "./errorComponent";
import { calculatePercentage, calculatePercentageOf } from "~/utils";
import { handleGraphQLError, NewGraphQLSDK } from "~/graphql";
import { BudgetConfig, Month } from "~/generated/graphql";

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
  const param = useParams();
  const year = param.year;
  const month = param.month;

  const navigate = useNavigate();

  const [amount, setAmount] = createSignal(0);
  const [date, setDate] = createSignal("");
  const [description, setDescription] = createSignal("");
  const [notes, setNotes] = createSignal("");
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);
  const [budgetConfig] = createResource(async () => {
    const graphql = NewGraphQLSDK();
    let response = await graphql.GetMonthlyBudgetConfig({
      year: parseInt(year),
      // @ts-ignore
      month: month,
    });

    if (response.monthlyBudgetConfig.__typename == "GraphQLErrorObject") {
      const err = handleGraphQLError(response.monthlyBudgetConfig, navigate);
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
      amount(),
      budgetConfig()?.shawnPercentageAllocation ?? 0,
    );
  };

  const maggieSplit = () => {
    if (Number.isNaN(amount())) {
      return 0;
    }

    return calculatePercentage(
      amount(),
      budgetConfig()?.maggiePercentageAllocation ?? 0,
    );
  };

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

        <p>Shawn - ${shawnSplit()}</p>
        <p>Maggie - ${maggieSplit()}</p>
      </Show>
    </form>
  );
}
