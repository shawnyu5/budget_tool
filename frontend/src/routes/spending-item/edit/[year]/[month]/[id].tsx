import { useNavigate, useParams } from "@solidjs/router";
import axios, { isAxiosError } from "axios";
import {
  Accessor,
  createSignal,
  onMount,
  Setter,
  Show,
  Signal,
} from "solid-js";
import ErrorComponent from "~/components/errorComponent";
import { SpendingItemForm } from "~/components/spendingItemForm";
import { loadLocalConfig } from "~/config";
import { Month, SpendingItem } from "~/generated/graphql";
import { handleGraphQLClientError, NewGraphQLSDK } from "~/graphql";
import log from "~/logger";

export default function () {
  const params = useParams();
  const year = params.year;
  const month = params.month;
  const spendingItemID = params.id;
  const navigate = useNavigate();
  const graphqlSdk = NewGraphQLSDK();

  const [spendingItem, setSpendingItem] = createSignal<SpendingItem | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);

  onMount(async () => {
    try {
      const res = await graphqlSdk.SearchSpendingItem({
        inputs: {
          year: parseInt(year),
          month: month as Month,
          id: spendingItemID,
        },
      });

      if (!res.searchSpendingItem) {
        return;
      }

      setSpendingItem({
        id: res.searchSpendingItem?.id,
        amount: res.searchSpendingItem?.amount,
        date: res.searchSpendingItem?.date,
        dateRfc3339: res.searchSpendingItem?.dateRfc3339,
        description: res.searchSpendingItem?.description,
        notes: res.searchSpendingItem?.notes,
      });
    } catch (e) {
      handleGraphQLClientError(e, navigate);
    }
  });

  const onSubmit = async (
    updatedSpendingItem: SpendingItem,
    errorMessageSignal: Signal<string | null>,
  ) => {
    const [errorMessage, setErrorMessage] = errorMessageSignal;
    if (errorMessage()) {
      log.info("There is an error message on screen. Not submitting form...");
      return;
    }
    log.info("Submitting form");

    try {
      await graphqlSdk.UpdateSpendingItemByID({
        inputs: {
          year: parseInt(year),
          month: month as Month,
          spendingItem: updatedSpendingItem,
        },
      });

      navigate(`/?year=${year}&month=${month}`, { replace: true });
    } catch (e) {
      handleGraphQLClientError(e, navigate);
    }
  };

  return (
    <div id="spending-item-form">
      <Show when={errorMessage()}>
        <ErrorComponent errorMessage={errorMessage()} />
      </Show>
      <SpendingItemForm spendingItem={spendingItem} onSubmit={onSubmit} />
    </div>
  );
}
