import { Accessor, Setter } from "solid-js";
import "./monthsDropDown.css";

/**
 * A dropdown menu that contains the selected month
 *
 */
export default function (props: {
  value: Accessor<string>;
  setValue: Setter<string>;
}) {
  // TODO: put all the months in
  return (
    <div id="select-month">
      <select name="date" id="date" value="2">
        <option value="1" selected={props.value() === "1"}>
          January
        </option>
        <option value="2" selected={props.value() === "2"}>
          February
        </option>
        <option value="3" selected={props.value() === "3"}>
          March
        </option>
        <option value="4" selected={props.value() === "4"}>
          April
        </option>
      </select>
    </div>
  );
}
