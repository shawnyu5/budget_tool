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

      // const res = await axios.get<SpendingItem>(
      //   `${loadLocalConfig().backendUrl}/spending-item/${year}/${month}/${spendingItemID}`,
      //   {
      //     headers: {
      //       Authorization: `Bearer ${localStorage.getItem("token")}`,
      //     },
      //   },
      // );

      setSpendingItem({
        id: res.searchSpendingItem?.id,
        amount: res.data.amount,
        date: res.data.date,
        dateRfc3339: res.data.dateRfc3339,
        description: res.data.description,
        notes: res.data.notes,
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
      await axios.post(
        `${loadLocalConfig().backendUrl}/spending-item/${year}/${month}/${spendingItem()?.id}`,
        updatedSpendingItem,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
    } catch (e) {
      if (axios.isAxiosError(e)) {
        if (e.response?.status == 404) {
          log.info("No budget recorded for this month");
        } else if (e.response?.status == 403) {
          log.info("Access forbidden. Redirecting to login page");
          navigate("/login", { replace: true });
        } else if (e.response?.status == 401) {
          log.info(
            "Authenication token expired. Needs re authenication. Redirecting to login page",
          );
          navigate("/login", { replace: true });
        }
      }
      log.error("Failed to update budget: ", e);
      setErrorMessage(`Failed to update budget: ${e}`);
    }

    navigate(`/?year=${year}&month=${month}`, { replace: true });
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
