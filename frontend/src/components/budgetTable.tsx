import { action, useNavigate, useSearchParams } from "@solidjs/router";
import {
  createEffect,
  createSignal,
  For,
  Resource,
  Setter,
  Show,
} from "solid-js";
import {
  GetHomePageDataV2Query,
  MonthlyBudget,
  Transaction,
} from "~/generated/graphql";
import log from "~/logger";
import { MonthlySpending, SpendingItem } from "~/server";
import { formatRfc3339Date, formatRfc3339DateObj } from "~/utils";
import { PickerValue } from "@rnwonder/solid-date-picker";
import { clientOnly } from "@solidjs/start";
import { handleGraphQLClientError, NewGraphQLSDK } from "~/graphql";
const DatePicker = clientOnly(() => import("@rnwonder/solid-date-picker"));

export default function BudgetTable(props: {
  data: Resource<GetHomePageDataV2Query | undefined>;
  mutate: Setter<GetHomePageDataV2Query | undefined>;
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // If the table is being edited
  const [isEditing, setIsEditing] = createSignal(false);
  const graphqlSdk = NewGraphQLSDK();

  /**
   * Removes a spending item from the table
   * @param transaction - the spending entry to remove
   */
  const deleteTransaction = async (transaction: Transaction) => {
    log.info(
      `Removing transaction with ID ${transaction.id}, description: ${transaction.description}`,
    );

    const previous = props.data()?.homePageV2.transactions;
    props.mutate((prev) => {
      if (!prev) return;
      return {
        ...prev,
        homePageV2: {
          ...prev.homePageV2,
          transactions: prev?.homePageV2.transactions.filter(
            (t) => t.id != transaction.id,
          ),
        },
      };
    });

    try {
      // Call graphql to delete transaction from DB
      graphqlSdk.DeleteTransactionByID({
        inputs: {
          transactionId: transaction.id,
        },
      });
    } catch (e) {
      // If graphql call fails. Revert the mutation on screen
      props.mutate((prev) => {
        if (!prev) return;
        return {
          ...prev,
          homePageV2: {
            ...prev?.homePageV2,
            transactions: previous ?? [],
          },
        };
      });
      handleGraphQLClientError(e, navigate);
    }

    // const prev = props.data();
    // if (!prev) return;
    //
    // let updated = {
    //   ...prev,
    //   spending: (prev.spending ?? []).filter((item) => item.id !== entry.id),
    // };
    //
    // const updatedSpending = updated.spending.reduce((total, spending) => {
    //   return total + spending.amount;
    // }, 0);
    // updated.totalSpending = updatedSpending;
    //
    // props.setMonthlyBudget(updated);
    // log.info("Spending entry removed");
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
        onSubmit={(e) => {
          e.preventDefault();
          setIsEditing(false);
        }}
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
            <For each={props.data()?.homePageV2.transactions ?? []}>
              {(entry) => {
                const [date, setDate] = createSignal<PickerValue>({
                  value: {
                    selected: entry.date.toISOString(),
                  },
                  label: "",
                });
                // const date: PickerValue = {
                //   value: {
                //     selected: entry.date.toISOString(),
                //   },
                //   label: "",
                // };
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
                          replace: false,
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
                          // TODO: add delete budget item handler
                          onClick={() => deleteTransaction(entry)}
                        >
                          ❎
                        </button>
                      </td>
                    </Show>
                    <td>
                      <span>$</span>
                      {entry.amount.toNumber()}
                    </td>
                    <td>{formatRfc3339DateObj(entry.date)}</td>
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
