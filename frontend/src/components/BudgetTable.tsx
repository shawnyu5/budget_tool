import { action, useNavigate, useSearchParams } from "@solidjs/router";
import {
  createEffect,
  createSignal,
  For,
  Resource,
  Setter,
  Show,
} from "solid-js";
import { GetHomePageDataV2Query, Transaction } from "~/generated/graphql";
import log from "~/logger";
import { formatRfc3339DateObj } from "~/utils";
import { handleGraphQLClientError, NewGraphQLSDK } from "~/graphql";
import Decimal from "decimal.js";
import { Button, Table } from "solid-bootstrap";

export default function BudgetTable(props: {
  data: Resource<GetHomePageDataV2Query | undefined>;
  setErrorMessage: (msg: string | undefined) => void;
  mutate: Setter<GetHomePageDataV2Query | undefined>;
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // If the table is being edited
  const [isEditing, setIsEditing] = createSignal(false);
  const graphqlSdk = NewGraphQLSDK();

  /**
   * Removes a transaction from the table
   * @param transaction - the transaction to remove
   */
  const deleteTransaction = async (transaction: Transaction) => {
    log.info(
      `Removing transaction with ID ${transaction.id}, description: ${transaction.description}`,
    );

    const previous = props.data()?.homePageV2.transactions;
    props.mutate((prev) => {
      if (!prev) return;
      const transactions = prev?.homePageV2.transactions.filter(
        (t) => t.id != transaction.id,
      );

      return {
        ...prev,
        homePageV2: {
          ...prev.homePageV2,
          totalSpending: new Decimal(
            transactions.reduce((acc, t) => acc + Number(t.amount), 0),
          ),
          transactions,
        },
      };
    });

    try {
      // Call graphql to delete transaction from DB
      await graphqlSdk.DeleteTransactionByID({
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
      handleGraphQLClientError(e, navigate, props.setErrorMessage);
    }
  };

  return (
    <div id="spending-table">
      <Show when={!isEditing()}>
        <div id="edit-save-buttons">
          <Button
            variant="primary"
            onClick={() => {
              navigate(
                `/spending-item/add/${searchParams.year}/${searchParams.month}`,
              );
            }}
          >
            Add
          </Button>
          <p></p>
          <Button
            variant="danger"
            onClick={() => {
              setIsEditing(true);
            }}
          >
            Delete
          </Button>
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
          <Button variant="success" type="submit">
            Save
          </Button>
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
        <Table striped bordered hover>
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
                        <Button
                          variant="danger"
                          onClick={() => deleteTransaction(entry)}
                        >
                          ❎
                        </Button>
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
        </Table>
      </form>
    </div>
  );
}
