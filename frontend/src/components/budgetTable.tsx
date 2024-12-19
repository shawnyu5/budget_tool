import { action } from "@solidjs/router";
import {
  Accessor,
  createEffect,
  createSignal,
  For,
  Setter,
  Show,
} from "solid-js";
import log from "~/logger";
import { MonthlyBudget, MonthlySpending, SpendingItem } from "~/monthlyBudget";
import ErrorComponent from "./errorComponent";

export default function (props: {
  monthlyBudget: Accessor<MonthlyBudget | null>;
  setMonthlyBudget: Setter<MonthlyBudget | null>;
}) {
  // If the table is being edited
  const [isEditing, setIsEditing] = createSignal(false);
  // Any error currently on screen
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);
  // Spending for the current month
  const [monthlySpending, setMonthlySpending] =
    createSignal<MonthlySpending | null>();

  createEffect(() => {
    log.info("monthly spending has changed. Updating table");
    setMonthlySpending(props.monthlyBudget()?.spending);
  });

  /**
   * Removes a spending item from the table
   * @param entry - the spending entry to remove
   */
  const removeSpendingItem = (entry: SpendingItem) => {
    log.info(
      `Removing spending entry ID ${entry.id}, description: ${entry.description}`,
    );

    const updatedSpending = (monthlySpending() ?? []).filter(
      (spending) => spending.id != entry.id,
    );
    setMonthlySpending(updatedSpending);
  };

  /**
   * Adds an empty spending item to the beginning of the list
   */
  const addSpendingItem = () => {
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
  };

  return (
    <>
      <Show when={errorMessage()}>
        <ErrorComponent message={errorMessage()} />
      </Show>
      <Show when={!isEditing()}>
        <div id="edit-save-buttons">
          <button class="button" onClick={addSpendingItem}>
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
          {
            // TODO: implement this cancel button
            // <button
            //   class="alert button"
            //   onClick={() => {
            //     setIsEditing(false);
            //   }}
            // >
            //   Cancel
            // </button>
            // <p></p>
          }
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
                          // style={{ width: "10%" }}
                          onClick={() => removeSpendingItem(entry)}
                        >
                          ❎
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
                          onBlur={() =>
                            setMonthlySpending((prev) => {
                              if (!prev) return;
                              log.info(
                                `Updating description to ${description()}`,
                              );
                              const updated = [...prev];
                              updated[idx()].description = description();
                              return prev;
                            })
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
