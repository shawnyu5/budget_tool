import { createEffect, For, Show } from "solid-js";
import "./MonthsDropDown.css";
import { A, useLocation, useNavigate, useSearchParams } from "@solidjs/router";
import { monthNumberToName, setLocalAuthToken } from "~/utils";
import log from "~/logger";
import { exportCSV } from "~/server";
import { Container, Form, Nav, Navbar } from "solid-bootstrap";

/**
 * Custom Nav bar at the top of the page
 *
 * Puts the selected month in the query param, in the `month` param
 */
export default function CustomNavBar() {
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
    <Navbar bg="light" expand="lg">
      <Container fluid>
        {
          // TODO: consider adding logo here
        }
        <Navbar.Brand as={A} href="/">
          Big Cry baby Budget
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav>
            <Form.Select
              size="sm"
              name="year"
              value={searchParam.year}
              onChange={(e) => setSearchParam({ year: e.currentTarget.value })}
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
            </Form.Select>
            <Form.Select
              size="sm"
              name="month"
              value={searchParam.month}
              onChange={(e) => setSearchParam({ year: e.currentTarget.value })}
            >
              <For each={months}>
                {(month) => (
                  <option value={month} selected={searchParam.month == month}>
                    {month}
                  </option>
                )}
              </For>
            </Form.Select>
            <Show when={location.pathname == "/"}>
              <Nav.Link
                as={A}
                href={`/settings?month=${searchParam.month}&year=${searchParam.year}`}
              >
                Settings
              </Nav.Link>
            </Show>
            <Show when={location.pathname == "/settings"}>
              <Nav.Link
                as={A}
                href={`/?month=${searchParam.month}&year=${searchParam.year}`}
              >
                Home
              </Nav.Link>
            </Show>
            <Nav.Link
              onClick={async () => {
                const response = await exportCSV(
                  searchParam.year as string,
                  searchParam.month as string,
                );
                const blob = new Blob([response], { type: "text/plain" });
                log.info(`blob: ${blob}`);

                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = `dating_budget_${searchParam.year}_${searchParam.month}.csv`; // Set the desired file name
                link.click();
                URL.revokeObjectURL(link.href);
              }}
            >
              Export
            </Nav.Link>
            <Nav.Link
              onClick={() => {
                setLocalAuthToken("");
                navigate("/login");
              }}
            >
              Logout
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
