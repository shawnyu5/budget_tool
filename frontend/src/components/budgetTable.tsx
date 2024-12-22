import {
  action,
  useNavigate,
  useParams,
  useSearchParams,
} from "@solidjs/router";
import {
  Accessor,
  createEffect,
  createSignal,
  For,
  Resource,
  Setter,
  Show,
} from "solid-js";
import log from "~/logger";
import { MonthlyBudget, MonthlySpending, SpendingItem } from "~/monthlyBudget";
import ErrorComponent from "./errorComponent";

export default function (props: {
  monthlyBudget: Resource<MonthlyBudget | null>;
  setMonthlyBudget: Setter<MonthlyBudget | null>;
}) {
  // If the table is being edited
  const [isEditing, setIsEditing] = createSignal(false);
  // Any error currently on screen
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);
  // Spending for the current month
  const [monthlySpending, setMonthlySpending] =
    createSignal<MonthlySpending | null>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // createEffect(() => {
  //   log.info("monthly spending has changed. Updating spending table");
  //   setMonthlySpending(props.monthlyBudget()?.spending);
  // });

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
            <For each={props.monthlyBudget()?.spending}>
              {(entry) => {
                // const [amount, setAmount] = createSignal(entry.amount);
                // const [date, setDate] = createSignal(entry.date);
                // const [description, setDescription] = createSignal(
                //   entry.description,
                // );
                // const [notes, setNotes] = createSignal(entry.notes || "");

                return (
                  <tr
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
    </>
  );
}
