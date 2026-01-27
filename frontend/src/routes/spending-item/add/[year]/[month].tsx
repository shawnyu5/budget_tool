import { useNavigate, useParams } from "@solidjs/router";
import { Accessor, createSignal, Setter, Signal } from "solid-js";
import { SpendingItemForm } from "~/components/spendingItemForm";
import { Month, MonthlyBudget } from "~/generated/graphql";
import {
  handleGraphQLClientError,
  handleGraphQLErrorObject,
  NewGraphQLSDK,
} from "~/graphql";
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
    updatedSpendingItem: SpendingItem,
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
            id: updatedSpendingItem.id,
            amount: updatedSpendingItem.amount,
            date: updatedSpendingItem.date,
            description: updatedSpendingItem.description,
          },
        },
      });

      if (res.addSpendingItemByMonth.__typename == "GraphQLErrorObject") {
        const err = handleGraphQLErrorObject(res.addSpendingItemByMonth);
        // __AUTO_GENERATED_PRINT_VAR_START__
        console.log(
          "custom print var (anon)#onSubmit#if err: %s",
          JSON.stringify(err),
        ); // __AUTO_GENERATED_PRINT_VAR_END__
        setErrorMessage(err);
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
