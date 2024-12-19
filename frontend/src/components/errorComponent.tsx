import { Show } from "solid-js";

/**
 * An error component that displays an error message.
 * The component will disappear when the error message is empty
 */
export default function (props: { message: string | null }) {
  // const [isVisible, setIsVisible] = createSignal(true);

  return (
    <Show when={props.message}>
      <div class="callout alert" data-closable>
        <p>{props.message}</p>
        {
          // <button
          //   class="close-button"
          //   aria-label="Dismiss alert"
          //   type="button"
          //   // onClick={() => setIsVisible(false)}
          // >
          //   <span aria-hidden="true">&times;</span>
          // </button>
        }
      </div>
    </Show>
  );
}
