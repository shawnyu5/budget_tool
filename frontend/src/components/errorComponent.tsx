import { createSignal, onMount, Show } from "solid-js";

/**
 * An error component that will disappear after a set time
 */
export default function (props: { message: string | null; autoCloseTime?: number }) {
  const [isVisible, setIsVisible] = createSignal(false);

  // Automatically close the error after a specified time (default: 5 seconds)
  onMount(() => {
    setIsVisible(true);
    // const timeout = setTimeout(
    //   () => setIsVisible(false),
    //   props.autoCloseTime || 5000,
    // );
    // return () => clearTimeout(timeout); // Clean up timeout on component unmount
  });

  return (
    <Show when={isVisible()}>
      <div class="callout alert" data-closable>
        <p>{props.message}</p>
        <button
          class="close-button"
          aria-label="Dismiss alert"
          type="button"
          onClick={() => setIsVisible(false)}
        >
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
    </Show>
  );
}
