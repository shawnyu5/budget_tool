import { Alert } from "solid-bootstrap";
import { createSignal, Show } from "solid-js";

/**
 * An error component that displays an error message.
 * The component will disappear when the error message is empty
 * @param props.errorMessage - the error message to display. This component will only be visible when errorMessage is not empty
 */
export default function (props: { errorMessage: string | null }) {
  const [show, setShow] = createSignal(true);

  return (
    <Show when={show() && props.errorMessage}>
      <Alert
        variant="danger"
        dismissible
        onClose={() => setShow(false)}
        class="mt-3"
      >
        {props.errorMessage}
      </Alert>
    </Show>
  );
}
