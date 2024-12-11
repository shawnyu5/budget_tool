import { action, useSearchParams } from "@solidjs/router";
import axios from "axios";
import { Accessor, createSignal, For, Setter, Show } from "solid-js";
import { loadConfig } from "~/config";
import log from "~/logger";
import { MonthlyBudget, MonthlySpending, SpendingItem } from "~/monthlyBudget";
import EditSaveButton from "./editSaveButton";
import ErrorComponent from "./errorComponent";

// // The budget for a month
// type monthlyBudget =
//   paths["/budget/{year}/{month}"]["get"]["responses"][200]["content"]["application/json"];

export default function (props: {
  monthlyBudget: Accessor<MonthlyBudget | null>;
  setMonthlyBudget: Setter<MonthlyBudget | null>;
}) {
  const [searchParam, _setSearchParam] = useSearchParams();
  const [isEditing, setIsEditing] = createSignal(false);
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);

  /**
   * Handker for saving data
   **/
  const handleSave = async () => {
    setIsEditing(false); // Exit edit mode and save changes
    log.info(
      `Sending updated spending: ${JSON.stringify(props.monthlyBudget())}`,
    );
    axios.post(
      `${loadConfig().backendUrl}/budget/${searchParam.year}/${searchParam.month}`,
      props.monthlyBudget(),
    );
  };

  /**
   * Update data in state when any input field changes
   * @param index - the index in the table that was changed
   * @param field - the field that was updated
   * @param value - the updated value
   */
  const handleChange = (
    index: number,
    field: keyof SpendingItem,
    value: string,
  ) => {
    // TODO: this handler needs to handle the validation of input
    log.info(
      `Handling change for \`${field}\` at index \`${index}\` with value \`${value}\``,
    );
    setErrorMessage(null);

    if (
      (field == "amount" && isNaN(parseFloat(value))) ||
      parseFloat(value) <= 0
    ) {
      log.warn("Invalid amount...");
      setErrorMessage("Invalid amount");
      return;
    }

    if ((field == "description" || field == "date") && value == "") {
      log.warn(`No ${field} set`);
      setErrorMessage(`All items must have a ${field}!`);
      return;
    }
    setIsEditing(false);

    // Update the spending data
    props.setMonthlyBudget((prevBudget) => {
      if (!prevBudget) return prevBudget; // Check if there's a valid budget

      // Make a copy of the spending array to maintain reactivity
      const updatedSpending = [...prevBudget.spending];

      // Update the specific field of the spending entry
      updatedSpending[index] = {
        ...updatedSpending[index], // Clone the existing item
        [field]: field === "amount" ? parseFloat(value) : value, // Ensure the amount is parsed as a number
      };

      // Return the updated monthly budget
      return { ...prevBudget, spending: updatedSpending };
    });

    log.info(
      `Sending updated spending: ${JSON.stringify(props.monthlyBudget())}`,
    );
    axios.post(
      `${loadConfig().backendUrl}/budget/${searchParam.year}/${searchParam.month}`,
      props.monthlyBudget(),
    );
  };

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
    const updatedBudget: MonthlyBudget = {
      budget: props.monthlyBudget()?.budget ?? {
        // Default to an empty budget object if undefined
        maggie_percentage_allocation: 0,
        shawn_percentage_allocation: 0,
        total: 0,
      },
      month: props.monthlyBudget()?.month ?? "January",
      spending: updatedSpendingRecord,
    };
    props.setMonthlyBudget(updatedBudget);
  };

  const removeSpendingItem = (entry: SpendingItem) => {
    log.info(`Removing ${entry.id}`);
    const monthlySpending = props.monthlyBudget()?.spending ?? [];
    log.info(monthlySpending.length);

    const updatedMonthlySpending = monthlySpending.filter(
      (spending) => spending.id != entry.id,
    );
    const updatedBudget: MonthlyBudget = {
      budget: props.monthlyBudget()?.budget ?? {
        // Default to an empty budget object if undefined
        maggie_percentage_allocation: 0,
        shawn_percentage_allocation: 0,
        total: 0,
      },
      month: props.monthlyBudget()?.month ?? "January", // Default to an empty string if month is undefined
      spending: updatedMonthlySpending,
    };
    props.setMonthlyBudget(updatedBudget);
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
          <For each={props.monthlyBudget()?.spending}>
            {(entry, index) => (
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
                      type="number"
                      id={entry.id}
                      onChange={(e) => {
                        handleChange(index(), "amount", e.target.value);
                      }}
                      value={entry.amount}
                    />
                  ) : (
                    entry.amount
                  )}
                </td>
                <td>
                  {isEditing() ? (
                    <input
                      type="text"
                      value={entry.date}
                      id={entry.id}
                      required
                      onChange={(e) => {
                        handleChange(index(), "date", e.target.value);
                      }}
                    />
                  ) : (
                    entry.date
                  )}
                </td>
                <td>
                  {isEditing() ? (
                    <input
                      id={entry.id}
                      type="text"
                      onChange={(e) => {
                        handleChange(index(), "description", e.target.value);
                      }}
                      value={entry.description}
                    />
                  ) : (
                    entry.description
                  )}
                </td>
                <td>
                  {isEditing() ? (
                    <input
                      id={entry.id}
                      type="text"
                      onChange={(e) => {
                        handleChange(index(), "notes", e.target.value);
                      }}
                      value={entry.notes || ""}
                    />
                  ) : (
                    entry.notes
                  )}
                </td>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </>
  );
}
