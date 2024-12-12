import { action } from "@solidjs/router";
import {
  Accessor,
  children,
  createEffect,
  createSignal,
  For,
  JSX,
  on,
  Setter,
  Show,
  useContext,
} from "solid-js";
import log from "~/logger";
import { MonthlyBudget, MonthlySpending, SpendingItem } from "~/monthlyBudget";
import EditSaveButton from "./editSaveButton";
import ErrorComponent from "./errorComponent";
import { MonthlyBudgetContext } from "~/monthlyBudgetProvider";
import { useMonthlyBudget } from "~/useMonthlyBudget";

export default function (props: {
  monthlyBudget: Accessor<MonthlyBudget | null>;
  setMonthlyBudget: Setter<MonthlyBudget | null>;
}) {
  const [isEditing, setIsEditing] = createSignal(false);
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);
  const [spendingItems, setSpendingItems] =
    createSignal<MonthlySpending | null>();

  createEffect(() => {
    log.info(
      "monthlyBudget has changed. Updating spending items in budget table",
    );
    setSpendingItems(props.monthlyBudget()?.spending);
  });

  const addSpendingItem = () => {
    const date = new Date();
    const newSpendingItem: SpendingItem = {
      id: Date.now().toString(),
      amount: 0,
      date: `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`,
      description: "",
      notes: null,
    };
    const updatedSpendingRecord: MonthlySpending = [
      newSpendingItem,
      ...(props.monthlyBudget()?.spending ?? []),
    ];
    setSpendingItems(updatedSpendingRecord);
  };

  const removeSpendingItem = (entry: SpendingItem) => {
    log.info(`Removing spending entry ID ${entry.id}: ${entry.description}`);
    const monthlySpending = props.monthlyBudget()?.spending ?? [];

    const updatedMonthlySpending = monthlySpending.filter(
      (spending) => spending.id != entry.id,
    );
    setSpendingItems(updatedMonthlySpending);
  };

  const updateSpendingItem = (
    id: string,
    field: keyof SpendingItem,
    value: any,
  ) => {
    setSpendingItems((prev) => {
      if (!prev) return;
      const updatedSpending = prev.map((item) => {
        if (item.id === id) {
          log.info(
            `Updating spending items: ${field} for item ${item.description} to ${field}`,
          );
          // Only update the changed field in the specific item
          return { ...item, [field]: value };
        }
        return item;
      });
      return updatedSpending; // Only change the modified spending item
    });
  };

  // On blur or when the user finishes editing, update the parent signal
  const handleBlur = (id: string, field: keyof SpendingItem, value: any) => {
    updateSpendingItem(id, field, value); // Update parent signal only on blur
  };

  return (
    <>
      <Show when={errorMessage()}>
        <ErrorComponent message={errorMessage()} />
      </Show>
      <Show when={isEditing()}>
        <button class="button" onClick={addSpendingItem}>
          Add
        </button>
      </Show>
      <form
        action={action(async (formData) => {
          setIsEditing(false);
          await onFormSubmit(formData, spendingItems() as MonthlySpending, props.setMonthlyBudget);
        })}
        method="post"
      >
        <EditSaveButton isEditing={isEditing} setIsEditing={setIsEditing} />
        <table>
          <thead>
            <tr>
              <Show when={isEditing()}>
                {
                  // Delete button column
                }
                <th id="delete-button-column"></th>
              </Show>
              {/* @ts-ignore */}
              <th width="150">Amount ($)</th>
              {/* @ts-ignore */}
              <th width="150">Date</th>
              <th>Description</th>
              <th>Notes</th>
              {
                // <th width="150">Table Header</th>
              }
            </tr>
          </thead>
          <tbody>
            <For each={spendingItems()}>
              {(entry) => {
                const [amount, setAmount] = createSignal(entry.amount);
                const [date, setDate] = createSignal(entry.date);
                const [description, setDescription] = createSignal(
                  entry.description,
                );
                const [notes, setNotes] = createSignal(entry.notes || "");

                return (
                  <tr>
                    <Show when={isEditing()}>
                      <td>
                        <button
                          type="button"
                          class="alert button"
                          onClick={() => removeSpendingItem(entry)}
                        >
                          DELETE
                        </button>
                      </td>
                    </Show>
                    <td>
                      <span>$</span>
                      {
                        // TODO: refactor these text boxes into a component rather than copy pasting
                      }
                      {isEditing() ? (
                        <input
                          name={`amount-${entry.id}`}
                          type="number"
                          required
                          id={entry.id}
                          value={amount()}
                          onInput={(e: InputEvent) => {
                            const input = e.target as HTMLInputElement;
                            const amount = parseFloat(input.value);
                            setAmount(amount);
                          }}
                          onBlur={() =>
                            handleBlur(entry.id as string, "amount", amount())
                          }
                        />
                      ) : (
                        amount()
                      )}
                    </td>
                    <td>
                      {isEditing() ? (
                        <input
                          name={`date-${entry.id}`}
                          required
                          type="text"
                          value={date()}
                          id={entry.id}
                          onInput={(e: InputEvent) => {
                            const input = e.target as HTMLInputElement;
                            log.info(
                              `On input: setting date to ${input.value}`,
                            );
                            setDate(input.value);
                          }}
                          onBlur={() =>
                            handleBlur(entry.id as string, "date", date())
                          }
                        />
                      ) : (
                        date()
                      )}
                    </td>
                    <td>
                      {isEditing() ? (
                        <input
                          name={`description-${entry.id}`}
                          required
                          id={entry.id}
                          type="text"
                          value={description()}
                          onInput={(e: InputEvent) => {
                            const input = e.target as HTMLInputElement;
                            log.info(
                              `On input: setting date to ${input.value}`,
                            );
                            setDescription(input.value);
                          }}
                          onBlur={() =>
                            handleBlur(
                              entry.id as string,
                              "description",
                              description(),
                            )
                          }
                        />
                      ) : (
                        description()
                      )}
                    </td>
                    <td>
                      {isEditing() ? (
                        <input
                          id={entry.id}
                          type="text"
                          name={`notes-${entry.id}`}
                          value={notes()}
                          onInput={(e: InputEvent) => {
                            const input = e.target as HTMLInputElement;
                            log.info(
                              `On input: setting date to ${input.value}`,
                            );
                            setNotes(input.value);
                          }}
                          onBlur={() =>
                            handleBlur(entry.id as string, "notes", notes())
                          }
                        />
                      ) : (
                        entry.notes
                      )}
                    </td>
                  </tr>
                );
              }}
            </For>
          </tbody>
        </table>
      </form>
    </>
  );
}

async function onFormSubmit(
  data: FormData,
  monthlySpending: MonthlySpending,
  setMonthlyBudget: Setter<MonthlyBudget | null>,
) {
  setMonthlyBudget((prev) => {
    const updated = { ...prev, spending: monthlySpending };
    log.info(
      `Form submitted. Updating monthly budget: ${JSON.stringify(updated, null, 3)}`,
    );
    return updated;
  });
}

/**
 * An table element that will become an input form if it is being edited
 * @param isEditing - determines if the input form is being edited
 * @param editableComponent - the component to show when it is being edited
 * @param nonEditableComponent - the component to show when it is not being edited
 */
function EditableInputField(props: {
  // TODO: finish this component
  // Passing components in via props may not work the way im expecting...
  isEditing: Accessor<boolean>;
  editableComponent: JSX.Element;
  nonEditableComponent: JSX.Element;
}) {
  const editableComponent = children(() => props.editableComponent);
  const nonEditableComponent = children(() => props.nonEditableComponent);
  return props.isEditing() ? editableComponent() : nonEditableComponent();
  // <input
  //   id={entry.id}
  //   name={`description-${entry.id}`}
  //   type="text"
  //   // onChange={(e) => {
  //   //   handleChange(index(), "description", e.target.value);
  //   // }}
  //   value={entry.description}
  // />
}
