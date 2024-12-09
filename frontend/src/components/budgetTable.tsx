import { useSearchParams } from "@solidjs/router";
import type { paths } from "~/backend_schema";
import axios, { AxiosResponse } from "axios";
import { createResource, createSignal, For } from "solid-js";
import { loadConfig } from "~/config";
import { getMonthlyBudget } from "~/monthlyBudget";

// The budget for a month
type monthlyBudget =
  paths["/budget/{year}/{month}"]["get"]["responses"][200]["content"]["application/json"];

export default function () {
  const [data, setData] = createSignal([
    {
      price: "$100",
      date: "10/21/2002",
      service: "Airbnb",
      description: "Airbnb",
      notes: "",
    },
    {
      price: "$200",
      date: "11/15/2003",
      description: "Booking",
      notes: "SOme notes here...",
    },
  ]);

  const [searchParam, _setSearchParam] = useSearchParams();
  const [monthlySpending] = createResource(async () => {
    return (
      await getMonthlyBudget(
        searchParam.year as string,
        searchParam.month as string,
      )
    ).spending;
  });

  // Track edit mode (all rows are editable when true)
  const [isEditing, setIsEditing] = createSignal(false);

  // Handler for toggling edit mode
  const handleEdit = () => {
    setIsEditing(true); // Enable edit mode for all rows
  };

  // Handler for saving data
  const handleSave = async () => {
    setIsEditing(false); // Exit edit mode and save changes
  };

  // Update data in state when any input field changes
  const handleChange = (index: number, field: string, value: string) => {
    const updatedData = [...data()];
    //@ts-ignore
    updatedData[index][field] = value;
    console.log(`Updated data: ${JSON.stringify(updatedData)}`);
    setData(updatedData);
  };

  return (
    <>
      {
        // TODO: style these buttons
      }
      <button onClick={handleEdit}>EDIT</button>
      <br />
      <button onClick={handleSave}>SAVE</button>
      <table>
        <thead>
          <tr>
            <th width="150">Amount ($)</th>
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
            {(entry, index) => (
              <tr>
                <td>
                  <span>$</span>
                  {
                    // TODO: refactor these text boxes into a component rather than copy pasting
                  }
                  {isEditing() ? (
                    <input
                      type="text"
                      value={entry.amount}
                      onInput={(e) =>
                        handleChange(index(), "price", e.target.value)
                      }
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
                      onInput={(e) =>
                        handleChange(index(), "date", e.target.value)
                      }
                    />
                  ) : (
                    entry.date
                  )}
                </td>
                <td>
                  {isEditing() ? (
                    <input
                      type="text"
                      value={entry.description}
                      onInput={(e) =>
                        handleChange(index(), "description", e.target.value)
                      }
                    />
                  ) : (
                    entry.description
                  )}
                </td>
                <td>
                  {isEditing() ? (
                    <input
                      type="text"
                      value={entry.notes}
                      onInput={(e) =>
                        handleChange(index(), "notes", e.target.value)
                      }
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
