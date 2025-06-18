import { useNavigate, useParams } from "@solidjs/router";
import axios, { isAxiosError } from "axios";
import { Accessor, createSignal, onMount, Setter, Show } from "solid-js";
import ErrorComponent from "~/components/errorComponent";
import { SpendingItemForm } from "~/components/spendingItemForm";
import { loadLocalConfig } from "~/config";
import log from "~/logger";
import { SpendingItem } from "~/server";

export default function () {
  const params = useParams();
  const year = params.year;
  const month = params.month;
  const spendingItemID = params.id;
  const navigate = useNavigate();

  const [spendingItem, setSpendingItem] = createSignal<SpendingItem | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);

  onMount(async () => {
    try {
      const res = await axios.get<SpendingItem>(
        `${loadLocalConfig().backendUrl}/spending-item/${year}/${month}/${spendingItemID}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      setSpendingItem({
        id: res.data.id,
        amount: res.data.amount,
        date: res.data.date,
        description: res.data.description,
        notes: res.data.notes,
      });
    } catch (e) {
      log.error("Failed to get spending information: ", e);
      if (isAxiosError(e)) {
        setErrorMessage(`Failed to get spending information: ${e.message}`);
      }
    }
  });

  const onSubmit = async (
    updatedSpendingItem: SpendingItem,
    errorMessage: Accessor<string | null>,
    setErrorMessage: Setter<string | null>,
  ) => {
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
        <ErrorComponent message={errorMessage()} />
      </Show>
      <SpendingItemForm spendingItem={spendingItem} onSubmit={onSubmit} />
    </div>
  );
}
