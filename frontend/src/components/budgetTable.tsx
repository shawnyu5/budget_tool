import { action, useNavigate, useSearchParams } from "@solidjs/router";
import { createEffect, createSignal, For, Resource, Show } from "solid-js";
import log from "~/logger";
import { MonthlyBudget, MonthlySpending, SpendingItem } from "~/server";

export default function (props: {
  monthlyBudget: Resource<MonthlyBudget | null>;
  setMonthlyBudget: (monthlyBudget: MonthlyBudget) => Promise<void>;
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // If the table is being edited
  const [isEditing, setIsEditing] = createSignal(false);
  // Spending for the current month. We need something we can edit, so we can remove a specific spending item from the table
  const [monthlySpending, setMonthlySpending] =
    createSignal<MonthlySpending | null>();

  createEffect(() => {
    log.info("Monthly budget has changed. Updating spending table");
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
    log.info("Spending entry removed");
  };

  return (
    <div id="spending-table">
      {
        // <Show when={errorMessage()}>
        //   <ErrorComponent message={errorMessage()} />
        // </Show>
      }
      <Show when={!isEditing()}>
        <div id="edit-save-buttons">
          <button
            class="button"
            onClick={() => {
              navigate(
                `/spending-item/add/${searchParams.year}/${searchParams.month}`,
              );
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
            Delete
          </button>
        </div>
      </Show>
      <form
        action={action(async () => {
          if (!props.monthlyBudget()) return;

          log.info("Spending table modified. Updating month's budget");
          setIsEditing(false);

          const updated: MonthlyBudget = {
            ...(props.monthlyBudget() as MonthlyBudget),
            spending: monthlySpending() ?? [],
          };
          await props.setMonthlyBudget(updated);
        })}
        method="post"
      >
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
              {(entry) => {
                return (
                  <tr
                    style="cursor: pointer"
                    onClick={() => {
                      if (isEditing()) {
                        log.info("Deleting records. Not redirecting");
                        return;
                      }
                      log.info("Clicked on row. Redirecting");
                      navigate(
                        `/spending-item/edit/${searchParams.year}/${searchParams.month}/${entry.id}`,
                        {
                          replace: true,
                        },
                      );
                    }}
                  >
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
                      {entry.amount}
                    </td>
                    <td>{entry.date}</td>
                    <td>{entry.description}</td>
                    <td>{entry.notes}</td>
                  </tr>
                );
              }}
            </For>
          </tbody>
        </table>
      </form>
    </div>
  );
}
