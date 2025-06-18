import { useNavigate, useParams } from "@solidjs/router";
import axios from "axios";
import { Accessor, createSignal, Setter } from "solid-js";
import { MonthlyBudget } from "~/client";
import { SpendingItemForm } from "~/components/spendingItemForm";
import log from "~/logger";
import {
  getMonthlyBudget,
  SpendingItem,
  updateMonthlyBudget,
} from "~/server";
import { generateSpendingItemID } from "~/utils";

export default function () {
  const params = useParams();
  const year = params.year;
  const month = params.month;
  const navigate = useNavigate();
  const jsDate = new Date();
  const [spendingItem] = createSignal<SpendingItem | null>({
    id: generateSpendingItemID(),
    amount: 0,
    date: `${jsDate.getFullYear()}/${jsDate.getMonth() + 1}/${jsDate.getDate()}`,
    description: "",
    notes: "",
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
      const monthlyBudget = await getMonthlyBudget(year, month);
      const updatedBudget: MonthlyBudget = {
        ...monthlyBudget,
        spending: [updatedSpendingItem, ...monthlyBudget.spending],
      };

      await updateMonthlyBudget(year, month, updatedBudget);
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
    <SpendingItemForm
      spendingItem={spendingItem}
      onSubmit={onSubmit}
    />
  );
}
