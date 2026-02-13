import { useNavigate, useParams } from "@solidjs/router";
import { createSignal, Signal } from "solid-js";
import { SpendingItemForm } from "~/components/spendingItemForm";
import { AddSpendingItemByMonthError, Month } from "~/generated/graphql";
import { handleGraphQLClientError, NewGraphQLSDK } from "~/graphql";
import log from "~/logger";
import { SpendingItem } from "~/server";

export default function () {
  const params = useParams();
  const year = params.year;
  const month = params.month as Month;
  const navigate = useNavigate();
  const jsDate = new Date();
  const [spendingItem] = createSignal<SpendingItem>({
    id: crypto.randomUUID(),
    amount: 0,
    date: `${jsDate.getFullYear()}/${jsDate.getMonth() + 1}/${jsDate.getDate()}`,
    description: "",
    notes: "",
  });

  const onSubmit = async (
    newSpendingItem: SpendingItem,
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
      let res = await sdk.AddSpendingItemByMonth({
        inputs: {
          year: year,
          month: month,
          spendingItem: {
            id: newSpendingItem.id,
            amount: newSpendingItem.amount,
            date: newSpendingItem.date,
            dateRfc3339: new Date(newSpendingItem.date).toISOString(),
            description: newSpendingItem.description,
          },
        },
      });

      if (
        res.addSpendingItemByMonth.__typename ==
        "AddSpendingItemByMonthErrorObject"
      ) {
        if (
          res.addSpendingItemByMonth.code ==
          AddSpendingItemByMonthError.FireflyUpdateFailed
        ) {
          setErrorMessage(
            `Your transaction was created in this app. However the firefly transaction failed to create: ${res.addSpendingItemByMonth.message}. Please create the Firefly transaction manually...`,
          );
        }
      }
    } catch (e) {
      handleGraphQLClientError(e, navigate);
    }

    if (errorMessage()) {
      log.info(`There is error message on screen, not redirecting`);
      return;
    }

    navigate(`/?year=${year}&month=${month}`, { replace: true });
  };

  return <SpendingItemForm spendingItem={spendingItem} onSubmit={onSubmit} />;
}
