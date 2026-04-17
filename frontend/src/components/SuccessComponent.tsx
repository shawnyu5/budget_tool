import { Alert } from "solid-bootstrap";
import { createSignal, Show } from "solid-js";

/**
 * An component that displays a success message
 */
export default function (props: { message: string | null }) {
  const [show, setShow] = createSignal(true);

  return (
    <Show when={show()}>
      <Alert
        variant="success"
        dismissible
        onClose={() => setShow(false)}
        class="mt-3"
      >
        {props.message}
      </Alert>
    </Show>
  );
}
