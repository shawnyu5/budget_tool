import { action, useNavigate, useParams } from "@solidjs/router";
import axios from "axios";
import {
  Accessor,
  createSignal,
  ErrorBoundary,
  onMount,
  Setter,
} from "solid-js";
import ErrorComponent from "~/components/errorComponent";
import { SpendingItemForm } from "~/components/spendingItemForm";
import { loadConfig } from "~/config";
import log from "~/logger";
import { SpendingItem } from "~/server";

export default function () {
  const params = useParams();
  const year = params.year;
  const month = params.month;
  const navigate = useNavigate();

  const [spendingItem, setSpendingItem] = createSignal<SpendingItem | null>({
    id: params.id,
    amount: 0,
    date: "",
    description: "",
    notes: "",
  });
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);

  onMount(async () => {
    try {
      const res = await axios.get<SpendingItem>(
        `${loadConfig().backendUrl}/spending-item/${year}/${month}/${spendingItem()?.id}`,
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
      setErrorMessage(`Failed to get spending information: ${e}`);
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
        `${loadConfig().backendUrl}/spending-item/${year}/${month}/${spendingItem()?.id}`,
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

  return <SpendingItemForm spendingItem={spendingItem} onSubmit={onSubmit} />;
  // return (
  //   <form
  //     id="spending-item"
  //     method="post"
  //     action={action(async () => {
  //       if (errorMessage()) {
  //         log.info(
  //           "There is an error message on screen. Not submitting form...",
  //         );
  //         return;
  //       }
  //       log.info("Submitting form");

  //       const spendingItem: SpendingItem = {
  //         id: id(),
  //         amount: amount(),
  //         date: date(),
  //         description: description(),
  //         notes: notes(),
  //       };
  //       // TODO: error handling
  //       const response = await axios.post(
  //         `${loadConfig().backendUrl}/spending-item/${year}/${month}/${id()}`,
  //         spendingItem,
  //         {
  //           headers: {
  //             Authorization: `Bearer ${localStorage.getItem("token")}`,
  //           },
  //         },
  //       );

  //       navigate(`/?year=${year}&month=${month}`, { replace: true });
  //     })}
  //   >
  //     <ErrorComponent message={errorMessage()} />

  //     <label>Amount ($)</label>
  //     <input
  //       name="amount"
  //       type="number"
  //       step="0.01"
  //       required
  //       value={amount()}
  //       onInput={(e: InputEvent) => {
  //         const input = (e.target as HTMLInputElement).value;
  //         setAmount(parseFloat(input));
  //       }}
  //     />

  //     <label>Date</label>
  //     <input
  //       name="date"
  //       type="text"
  //       required
  //       value={date()}
  //       onInput={(e: InputEvent) => {
  //         const input = (e.target as HTMLInputElement).value;
  //         setDate(input);
  //       }}
  //     />

  //     <label>Description</label>
  //     <input
  //       name="description"
  //       type="text"
  //       required
  //       value={description()}
  //       onInput={(e: InputEvent) => {
  //         const input = (e.target as HTMLInputElement).value;
  //         setDescription(input);
  //       }}
  //     />

  //     <label>Notes</label>
  //     <textarea
  //       name="notes"
  //       style="height: 100px"
  //       // type="text"
  //       value={notes()}
  //       onInput={(e: InputEvent) => {
  //         const input = (e.target as HTMLInputElement).value;
  //         setNotes(input);
  //       }}
  //     />

  //     <button class="button success" type="submit">
  //       Save
  //     </button>
  //   </form>
  // );
}
