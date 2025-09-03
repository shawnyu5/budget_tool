import { action, useNavigate, useSearchParams } from "@solidjs/router";
import { createEffect, createSignal, For, Resource, Show } from "solid-js";
import { MonthlyBudget } from "~/generated/graphql";
import log from "~/logger";
import { MonthlySpending, SpendingItem } from "~/server";

export default function (props: {
  monthlyBudget: Resource<MonthlyBudget | null>;
  setMonthlyBudget: (monthlyBudget: MonthlyBudget) => void;
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // If the table is being edited
  const [isEditing, setIsEditing] = createSignal(false);

  /**
   * Removes a spending item from the table
   * @param entry - the spending entry to remove
   */
  const removeSpendingItem = (entry: SpendingItem) => {
    log.info(
      `Removing spending entry ID ${entry.id}, description: ${entry.description}`,
    );
    const prev = props.monthlyBudget();
    if (!prev) return;

    let updated = {
      ...prev,
      spending: (prev.spending ?? []).filter((item) => item.id !== entry.id),
    };

    const updatedSpending = updated.spending.reduce((total, spending) => {
      return total + spending.amount;
    }, 0);
    updated.totalSpending = updatedSpending

    props.setMonthlyBudget(updated);
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
            spending: props.monthlyBudget()?.spending ?? [],
          };
          props.setMonthlyBudget(updated);
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
            <For each={props.monthlyBudget()?.spending ?? []}>
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
                    {
                      // Delete button
                    }
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
