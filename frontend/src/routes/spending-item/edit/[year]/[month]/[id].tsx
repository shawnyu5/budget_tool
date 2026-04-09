import { useNavigate, useParams } from "@solidjs/router";
import axios, { isAxiosError } from "axios";
import {
  Accessor,
  createResource,
  createSignal,
  onMount,
  Setter,
  Show,
  Signal,
} from "solid-js";
import ErrorComponent from "~/components/errorComponent";
import { TransactionForm } from "~/components/TransactionForm";
import { loadLocalConfig } from "~/config";
import { Month, SpendingItem, Transaction } from "~/generated/graphql";
import { handleGraphQLClientError, NewGraphQLSDK } from "~/graphql";
import log from "~/logger";

export default function () {
  const params = useParams();
  const year = params.year;
  const month = params.month;
  const spendingItemID = params.id;
  const navigate = useNavigate();
  const graphqlSdk = NewGraphQLSDK();

  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);
  const [transaction] = createResource(async () => {
    try {
      const res = await graphqlSdk.SearchTransactionByID({
        inputs: {
          transactionId: spendingItemID,
        },
      });

      const t = res.searchTransactionV2.transaction;
      if (t) {
        return {
          id: t.id,
          amount: t.amount,
          date: new Date(t.date),
          description: t.description,
          notes: t.notes,
        } satisfies Transaction;
      } else {
        return undefined;
      }
    } catch (e) {
      handleGraphQLClientError(e, navigate);
    }
  });

  const onSubmit = async (
    transaction: Transaction,
    errorMessageSignal: Signal<string | null>,
  ) => {
    const [errorMessage, setErrorMessage] = errorMessageSignal;
    if (errorMessage()) {
      log.info("There is an error message on screen. Not submitting form...");
      return;
    }
    log.info("Submitting form");

    try {
      await graphqlSdk.UpdateTransactionByID({
        inputs: {
          transactionId: transaction.id,
          amount: transaction.amount,
          date: transaction.date,
          description: transaction.description,
          notes: transaction.notes,
        },
      });
      navigate(`/?year=${year}&month=${month}`, { replace: false });
    } catch (e) {
      handleGraphQLClientError(e, navigate);
    }
  };

  return (
    <div id="spending-item-form">
      <Show when={errorMessage()}>
        <ErrorComponent errorMessage={errorMessage()} />
      </Show>
      <TransactionForm transaction={transaction} onSubmit={onSubmit} />
    </div>
  );
}
