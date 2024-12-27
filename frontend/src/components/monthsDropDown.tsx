import {
  Accessor,
  createEffect,
  createSignal,
  For,
  Setter,
  Show,
} from "solid-js";
import "./monthsDropDown.css";
import { useLocation, useNavigate, useSearchParams } from "@solidjs/router";
import { monthNumberToName } from "~/utils";

/**
 * A dropdown menu that contains the selected month.
 *
 * Puts the selected month in the query param, in the `month` param
 */
export default function MonthsDropDown() {
  const [searchParam, setSearchParam] = useSearchParams();
  const date = new Date();
  const navigate = useNavigate();
  const location = useLocation();

  createEffect(() => {
    // If month is not in the query param, set it to the current month
    if (!searchParam.month) {
      setSearchParam({ month: monthNumberToName(date.getMonth() + 1) });
    }

    // If year is not in the query param, set it to the current year
    if (!searchParam.year) {
      setSearchParam({ year: date.getFullYear() });
    }
  });

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

  // Support the current and previous year
  const years = [date.getFullYear(), date.getFullYear() - 1];

  return (
    <div class="top-bar">
      <div class="top-bar-left">
        <ul class="dropdown menu" data-dropdown-menu>
          <li>
            <select
              name="year"
              id="year"
              onChange={(e) => {
                const selectedYear = e.target.value;
                setSearchParam({ year: selectedYear });
              }}
            >
              <For each={years}>
                {(year) => (
                  <option
                    value={year}
                    selected={searchParam.year == year.toString()}
                  >
                    {year}
                  </option>
                )}
              </For>
            </select>
          </li>
          <li>
            <select
              name="month"
              id="month"
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
          </li>
          <Show when={location.pathname == "/"}>
            <li>
              <a
                onClick={() => {
                  navigate("/settings", { replace: true });
                }}
              >
                Settings
              </a>
            </li>
          </Show>
          <Show when={location.pathname == "/settings"}>
            <li>
              <a
                onClick={() => {
                  navigate("/", { replace: true });
                }}
              >
                Home
              </a>
            </li>
          </Show>
        </ul>
      </div>
    </div>
  );
}
