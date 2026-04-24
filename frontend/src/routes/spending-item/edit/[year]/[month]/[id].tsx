import { useNavigate, useParams } from "@solidjs/router";
import { createResource, createSignal, Show, Signal } from "solid-js";
import ErrorComponent from "~/components/ErrorComponent";
import { TransactionForm } from "~/components/TransactionForm";
import { Transaction } from "~/generated/graphql";
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
      handleGraphQLClientError(e, navigate, setErrorMessage);
    }
  });

  const onSubmit = async (
    transaction: Transaction,
    errorMessageSignal: Signal<string | null>,
  ) => {
    const [_errorMessage, setErrorMessage] = errorMessageSignal;
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
      handleGraphQLClientError(e, navigate, setErrorMessage);
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
