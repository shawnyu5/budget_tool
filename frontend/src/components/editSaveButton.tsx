import { Accessor, Setter, Show } from "solid-js";

/**
 * A button that shows `Edit` be default. Once clicked, will change to `Save`
 * @param isEditing - signal determining if the input fields are being edited. Will show `Save` if `isEditing` is true
 * @param setIsEditing - setter for the state of if the input fields are being edited or not
 * @param onSubmit - optional function to all on clicking save
 */
export default function (props: {
  isEditing: Accessor<boolean>;
  setIsEditing: Setter<boolean>;
}) {
  const editButton = (
    <button
      class="submit primary button"
      onClick={() => props.setIsEditing(true)}
    >
      Edit
    </button>
  );
  const saveButton = (
    <button
      class="submit success button"
      // onClick={(e) => {
      //   props.setIsEditing(false);
      //   e.currentTarget?.form?.submit();
      // }}
      type="submit"
    >
      Save
    </button>
  );

  return (
    <Show when={props.isEditing()} fallback={editButton}>
      {saveButton}
    </Show>
  );
}
