import { useNavigate, useParams } from "@solidjs/router";
import Decimal from "decimal.js";
import { createSignal, Signal } from "solid-js";
import { TransactionForm } from "~/components/TransactionForm";
import {
  AddSpendingItemByMonthError,
  Month,
  SpendingItem,
  Transaction,
} from "~/generated/graphql";
import { handleGraphQLClientError, NewGraphQLSDK } from "~/graphql";
import log from "~/logger";

export default function () {
  const params = useParams();
  const year = params.year;
  const month = params.month as Month;
  const navigate = useNavigate();
  const jsDate = new Date();
  // const [transaction] = createSignal<Transaction>({
  //   id: crypto.randomUUID(),
  //   amount: new Decimal(0),
  //   date: new Date(),
  //   description: "",
  //   notes: "",
  // });

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
    const sdk = NewGraphQLSDK();
    try {
      await sdk.AddTransactionV2({
        inputs: {
          month: month,
          year: parseInt(year),
          transaction: {
            id: crypto.randomUUID(),
            amount: new Decimal(transaction.amount),
            date: transaction.date,
            description: transaction.description,
            notes: transaction.notes,
          },
        },
      });
    } catch (e) {
      handleGraphQLClientError(e, navigate, setErrorMessage);
    }

    if (errorMessage()) {
      log.info(`There is error message on screen, not redirecting`);
      return;
    }

    navigate(`/?year=${year}&month=${month}`, { replace: true });
  };

  return <TransactionForm onSubmit={onSubmit} />;
}
