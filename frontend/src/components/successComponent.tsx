import { Show } from "solid-js";

/**
 * An component that displays a success message
 */
export default function (props: { message: string | null }) {
  return (
    <Show when={props.message}>
      <div class="callout success" data-closable>
        <p>{props.message}</p>
      </div>
    </Show>
  );
}
