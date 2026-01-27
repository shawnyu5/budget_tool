import { Show } from "solid-js";

/**
 * An error component that displays an error message.
 * The component will disappear when the error message is empty
 */
export default function (props: { errorMessage: string | null }) {
  // const [isVisible, setIsVisible] = createSignal(true);

  //   <div class="callout" data-closable>
  //   <p>You can so totally close this!</p>
  //   <button class="close-button" aria-label="Dismiss alert" type="button" data-close>
  //     <span aria-hidden="true">&times;</span>
  //   </button>
  // </div>

  return (
    <Show when={props.errorMessage}>
      <div class="callout alert" data-closable>
        <p>{props.errorMessage}</p>
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
