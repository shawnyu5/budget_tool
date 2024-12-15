import { action } from "@solidjs/router";
import {
  Accessor,
  children,
  createEffect,
  createSignal,
  For,
  JSX,
  Setter,
  Show,
  Suspense,
} from "solid-js";
import log from "~/logger";
import { MonthlyBudget, MonthlySpending, SpendingItem } from "~/monthlyBudget";
import ErrorComponent from "./errorComponent";

export default function (props: {
  monthlyBudget: Accessor<MonthlyBudget | null>;
  setMonthlyBudget: Setter<MonthlyBudget | null>;
}) {
  const [isEditing, setIsEditing] = createSignal(false);
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);
  const [monthlySpending, setMonthlySpending] =
    createSignal<MonthlySpending | null>();

  createEffect(() => {
    log.info("monthly spending has changed. Updating table");
    setMonthlySpending(props.monthlyBudget()?.spending);
  });

  const addSpendingItem = () => {
    const date = new Date();
    const newSpendingItem: SpendingItem = {
      id: Date.now().toString(),
      amount: 0,
      date: `${date.getFullYear()}/${props.monthlyBudget()?.month}/${date.getDate()}`,
      description: "",
      notes: null,
    };
    const updatedSpendingRecord: MonthlySpending = [
      ...(props.monthlyBudget()?.spending ?? []),
      newSpendingItem,
    ];

    // props.setMonthlyBudget((prev) => {
    //   const updated = {
    //     ...prev,
    //     spending: updatedSpendingRecord,
    //   };
    //   return updated as MonthlyBudget;
    // });
    setMonthlySpending(updatedSpendingRecord);
  };

  const removeSpendingItem = (entry: SpendingItem) => {
    log.info(`Removing spending entry ID ${entry.id}: ${entry.description}`);
    const monthlySpending = props.monthlyBudget()?.spending ?? [];

    const updatedSpending = monthlySpending.filter(
      (spending) => spending.id != entry.id,
    );
    // props.setMonthlyBudget((prev) => {
    //   const updated = {
    //     ...prev,
    //     spending: updatedSpending,
    //   };
    //   return updated as MonthlyBudget;
    // });
    setMonthlySpending(updatedSpending);
  };

  const updateSpendingItem = (
    id: string,
    field: keyof SpendingItem,
    value: any,
  ) => {
    setMonthlySpending((prev) => {
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
  // const handleBlur = (
  //   idx: number,
  //   field: keyof SpendingItem,
  //   value: any,
  // ) => {
  //   setMonthlySpending((prev) => {
  //     if (!prev) return;
  //     log.info(`Updating ${String(field)} to ${value}`);
  //     const updated = [...prev];
  //     updated[idx][field] = value

  //     return prev;
  //   });
  //   // updateSpendingItem(id, field, value); // Update parent signal only on blur
  // };

  return (
    <>
      <Show when={errorMessage()}>
        <ErrorComponent message={errorMessage()} />
      </Show>
      {
        // <Show when={isEditing()}>
        //   <button class="button" onClick={addSpendingItem}>
        //     Add
        //   </button>
        // </Show>
      }
      <Show when={!isEditing()}>
        <div id="edit-save-buttons">
          <button
            class="button"
            onClick={() => {
              setIsEditing(true);
              setMonthlySpending((prev) => {
                if (!prev) return;

                const date = new Date();
                const newSpendingItem: SpendingItem = {
                  id: Date.now().toString(),
                  amount: 0,
                  date: `${date.getFullYear()}/${date.getMonth()}/${date.getDate()}`,
                  description: "",
                  notes: null,
                };

                const updatedSpending = [newSpendingItem, ...prev];
                log.info(
                  `Adding item to spend table: ${JSON.stringify(updatedSpending)}`,
                );
                return updatedSpending;
              });
              // props.setMonthlyBudget((prev) => {
              //   const date = new Date();
              //   const newSpendingItem: SpendingItem = {
              //     id: Date.now().toString(),
              //     amount: 0,
              //     date: `${date.getFullYear()}/${date.getMonth()}/${date.getDate()}`,
              //     description: "",
              //     notes: null,
              //   };
              //   const updatedSpendingRecord: MonthlySpending = [
              //     ...(props.monthlyBudget()?.spending ?? []),
              //     newSpendingItem,
              //   ];

              //   const updated = {
              //     ...prev,
              //     spending: updatedSpendingRecord,
              //   };
              //   return updated as MonthlyBudget
              // });
            }}
          >
            Add
          </button>
          <p></p>
          <button
            class="button"
            onClick={() => {
              setIsEditing(true);
            }}
          >
            Edit
          </button>
        </div>
      </Show>
      <form
        action={action(async () => {
          log.info("Submitting form");
          if (errorMessage()) {
            log.info(
              "There is an error message on screen. Not submitting form...",
            );
            return;
          }

          log.info("Updating monthly budget");
          setIsEditing(false);

          props.setMonthlyBudget((prev) => {
            if (!prev) return null;
            const updated = {
              ...prev,
              spending: monthlySpending() ?? [],
            };
            return updated;
          });
        })}
        method="post"
      >
        {
          // <EditSaveButton isEditing={isEditing} setIsEditing={setIsEditing} />
        }
        <Show when={isEditing()}>
          <button class="button" type="submit">
            Save
          </button>
        </Show>
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
            <For each={monthlySpending()}>
              {(entry, idx) => {
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
                            if (amount == 0) {
                              setErrorMessage("Amount must be greater than 0!");
                              return;
                            }
                            setErrorMessage("");
                            setAmount(amount);
                          }}
                          onBlur={() =>
                            setMonthlySpending((prev) => {
                              if (!prev) return;
                              log.info(
                                `Updating spending amount to ${amount()}`,
                              );
                              const updated = [...prev];
                              updated[idx()].amount = amount();
                              return prev;
                            })
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
                            const date = input.value;
                            setDate(date);
                          }}
                          onBlur={
                            () =>
                              setMonthlySpending((prev) => {
                                if (!prev) return;
                                log.info(`Updating date to ${amount()}`);
                                const updated = [...prev];
                                updated[idx()].date = date();
                                return prev;
                              })
                            // handleBlur(entry.id as string, "date", date())
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
                            const date = input.value;
                            setDescription(date);
                          }}
                          onBlur={
                            () =>
                              setMonthlySpending((prev) => {
                                if (!prev) return;
                                log.info(
                                  `Updating description to ${description()}`,
                                );
                                const updated = [...prev];
                                updated[idx()].description = description();
                                return prev;
                              })
                            // handleBlur(
                            //   entry.id as string,
                            //   "description",
                            //   description(),
                            // )
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
                            const notes = input.value;
                            setNotes(notes);
                          }}
                          onBlur={() =>
                            setMonthlySpending((prev) => {
                              if (!prev) return;
                              log.info(`Updating notes to ${notes()}`);
                              const updated = [...prev];
                              updated[idx()].notes = notes();
                              return prev;
                            })
                          }
                        />
                      ) : (
                        notes()
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
