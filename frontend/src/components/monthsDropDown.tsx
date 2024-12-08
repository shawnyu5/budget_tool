import { Accessor, createSignal, For, Setter } from "solid-js";
import "./monthsDropDown.css";
import { useSearchParams } from "@solidjs/router";
import { monthNumberToName } from "~/utils";

/**
 * A dropdown menu that contains the selected month.
 *
 * Puts the selected month in the query param, in the `month` param
 */
export default function () {
  const [searchParam, setSearchParam] = useSearchParams();
  if (!searchParam.month) {
    const date = new Date();
    setSearchParam({ month: monthNumberToName(date.getMonth()) });
  }

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <div id="select-month">
      <select
        name="date"
        id="date"
        onChange={(e) => {
          const selectedMonth = e.target.value;
          setSearchParam({ month: selectedMonth });
        }}
      >
        <For each={months}>
          {(month) => (
            <option value={month} selected={searchParam.month == month}>
              {month}
            </option>
          )}
        </For>
      </select>
    </div>
  );
}
