import { action } from "@solidjs/router";
import { normalizeProps, useMachine } from "@zag-js/solid";
import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  createUniqueId,
  Resource,
  Show,
  Signal,
} from "solid-js";
import ErrorComponent from "./ErrorComponent";
import { formatRfc3339DateObj } from "~/utils";
import { Transaction } from "~/generated/graphql";
import { clientOnly } from "@solidjs/start";
import * as combobox from "@zag-js/combobox";
const DatePicker = clientOnly(() => import("@rnwonder/solid-date-picker"));
import "@rnwonder/solid-date-picker/dist/style.css";
import { PickerValue, TimeValue } from "@rnwonder/solid-date-picker";
import Decimal from "decimal.js";
import TimePicker from "@rnwonder/solid-date-picker/timePicker";
import { Button, Col, Form, Row, Spinner } from "solid-bootstrap";
import { NewGraphQLSDK } from "~/graphql";

/**
 * A form that displays a transaction
 */
export function TransactionForm(props: {
  transaction?: Resource<Transaction | undefined>;
  onSubmit: (
    transaction: Transaction,
    errorMessageSignal: Signal<string | null>,
  ) => Promise<void>;
}) {
  const [amount, setAmount] = createSignal<string>();
  const [description, setDescription] = createSignal("");
  const [descriptionAutoComplete, setDescriptionAutoComplete] = createSignal();
  const [notes, setNotes] = createSignal("");
  const [datePicker, setDatePicker] = createSignal<PickerValue>({
    label: "",
    value: {},
  });
  const [timePicker, setTimePicker] = createSignal<TimeValue>({
    value: {},
    label: "",
  });

  const [descriptionAutoCompleteCandidates] = createResource(
    description,
    async () => {
      const graphql = NewGraphQLSDK();
      const t = await graphql.GetTransactionDescriptions({
        inputs: {
          limit: 100,
        },
      });

      return t.getTransactions.transactions;
    },
  );

  const collection = createMemo(() =>
    combobox.collection({
      items: descriptionAutoCompleteCandidates() ?? [],
      itemToValue: (item) => item.description,
      itemToString: (item) => item.description,
    }),
  );

  const service = useMachine(combobox.machine, {
    id: createUniqueId(),
    get collection() {
      return collection();
    },
    onOpenChange() {
      setDescriptionAutoComplete(descriptionAutoCompleteCandidates());
    },
    onInputValueChange({ inputValue }) {
      const filtered = descriptionAutoCompleteCandidates()?.filter((item) =>
        item.description.toLowerCase().includes(inputValue.toLowerCase()),
      );
      setDescriptionAutoComplete(filtered);
    },
  });

  const api = createMemo(() => combobox.connect(service, normalizeProps));

  const errorMessageSignal = createSignal<string | null>(null);
  // Tracks if the form has been submitted or not
  const [formSubmitted, setFormSubmitted] = createSignal(false);
  const [errorMessage, _setErrorMessage] = errorMessageSignal;

  createEffect(() => {
    const tx = props.transaction?.();
    if (tx) {
      setAmount(tx.amount.toString());
      setDescription(tx.description);
      setNotes(tx.notes);
      setDatePicker({
        value: {
          selected: formatRfc3339DateObj(tx.date ?? new Date()),
        },
        label: "",
      });
      setTimePicker({
        value: {
          hour: tx.date.getHours(),
          minute: tx.date.getMinutes(),
          second: tx.date.getSeconds(),
        },
        label: tx.date.toLocaleTimeString([], {
          hour12: true,
          timeStyle: "short",
        }),
      });
    } else {
      // Set default values
      const date = new Date();
      setDatePicker({
        value: {
          selected: formatRfc3339DateObj(new Date()),
        },
        label: "",
      });
      setTimePicker({
        value: {
          hour: date.getHours(),
          minute: date.getMinutes(),
          second: date.getSeconds(),
        },
        label: date.toLocaleTimeString([], {
          hour12: true,
          timeStyle: "short",
        }),
      });
    }
  });

  return (
    <Form
      id="spending-item"
      method="post"
      action={action(async () => {
        setFormSubmitted(true);
        let date = new Date(datePicker().value.selected ?? "");
        date.setHours(timePicker().value.hour ?? 0);
        date.setMinutes(timePicker().value.minute ?? 0); // Fixed typo from .hour to .minute
        try {
          await props.onSubmit(
            {
              id: props.transaction?.()?.id ?? crypto.randomUUID(),
              amount: new Decimal(amount() ?? "0"),
              date: date,
              description: description(),
              notes: notes(),
            } satisfies Transaction,
            errorMessageSignal,
          );
        } finally {
          setFormSubmitted(false);
        }
      })}
    >
      <ErrorComponent errorMessage={errorMessage()} />

      <Show
        when={!props.transaction?.loading}
        fallback={
          <div class="text-center p-5">
            <Spinner animation="border" /> <p>Loading...</p>
          </div>
        }
      >
        {/* Description Field */}
        <Form.Group controlId="description" class="mb-3">
          <Form.Label>Description</Form.Label>
          <Form.Control
            name="description"
            type="text"
            required
            value={description()}
            onInput={(e) => setDescription(e.currentTarget.value)}
          />
        </Form.Group>

        {/* Date and Time Pickers */}
        <Form.Group class="mb-3">
          <Form.Label>Date & Time</Form.Label>
          <Row>
            <Col md={7} class="mb-2 mb-md-0">
              <DatePicker
                type="single"
                value={datePicker}
                setValue={setDatePicker}
              />
            </Col>
            <Col md={5}>
              <TimePicker value={timePicker} setValue={setTimePicker} />
            </Col>
          </Row>
        </Form.Group>

        {/* Amount Field */}
        <Form.Group controlId="amount" class="mb-3">
          <Form.Label>Amount ($)</Form.Label>
          <Form.Control
            name="amount"
            type="number"
            step="0.01"
            required
            value={amount()}
            onInput={(e) => setAmount(e.currentTarget.value)}
          />
        </Form.Group>

        {/* Notes Field */}
        <Form.Group controlId="notes" class="mb-4">
          <Form.Label>Notes</Form.Label>
          <Form.Control
            as="textarea"
            name="notes"
            rows={3}
            value={notes()}
            onInput={(e) => setNotes(e.currentTarget.value)}
            style={{ height: "100px" }}
          />
        </Form.Group>

        {/* Submit Button */}
        <Button
          variant="success"
          type="submit"
          disabled={formSubmitted()}
          class="w-100"
        >
          <Show when={formSubmitted()} fallback="Save">
            <Spinner
              as="span"
              animation="border"
              size="sm"
              role="status"
              aria-hidden="true"
              class="me-2"
            />
            Saving...
          </Show>
        </Button>
      </Show>
    </Form>
  );
}

export function RemoteAutoComplete() {
  const [query, setQuery] = createSignal("");

  function fetchUsers() {
    return ["foo", "bar"];
  }
  const [transactionDescriptions] = createResource(query, async () => {
    const graphql = NewGraphQLSDK();
    return graphql.GetTransactionDescriptions({
      inputs: {
        limit: 100,
      },
    });
  });
  const transactions = createMemo(() => {
    combobox.collection({
      items: transactionDescriptions()?.getTransactions.transactions ?? [],
    });
  });

  const service = useMachine(combobox.machine, {
    id: createUniqueId(),
  });
  createMemo(() => {
    const data = transactionDescriptions;
    if (data) api().collection.setItems(data);
  });

  const api = createMemo(() => combobox.connect(service, normalizeProps));
}
