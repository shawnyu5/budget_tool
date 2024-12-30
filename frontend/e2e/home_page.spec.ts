import test, { expect } from "@playwright/test";
import { monthNumberToName } from "~/utils";

const date = new Date();
test("Nav bar displays correct date", async ({ page }) => {
  await page.goto(
    `http://localhost:3000/?year=${date.getFullYear()}&month=${monthNumberToName(date.getMonth() + 1)}`,
  );
  const navBar = page.locator("#nav-bar");
  await expect(navBar).toBeInViewport();
  await expect(navBar, {
    message: "Expected nav bar to contain current year",
  }).toContainText(date.getFullYear().toString());

  const yearDropdown = page.locator("#year-dropdown");
  const selectedYear: string = await yearDropdown.evaluate(
    // @ts-ignore
    (select) => select.value,
  );
  expect(selectedYear, {
    message: "Expect selected year to be current year",
  }).toBe(date.getFullYear().toString());

  const monthDropdown = page.locator("#month-dropdown");
  const selectedMonth: string = await monthDropdown.evaluate(
    // @ts-ignore
    (select) => select.value,
  );

  expect(selectedMonth, {
    message: "Expect selected month to be the current month",
  }).toBe(monthNumberToName(date.getMonth() + 1));
});

test("Displays correct budget", async ({ page }) => {
  await page.goto(
    `http://localhost:3000/?year=${date.getFullYear()}&month=${monthNumberToName(date.getMonth() + 1)}`,
  );

  const monthlyBudget = page.locator("#monthly-budget");

  // These numbers are what the mock backend should return
  await expect(monthlyBudget, {
    message:
      "Monthly budget should show the correct total spending and total allocation",
  }).toContainText(`Remaining:$200/$300`);
});

test("Displays correct spending item", async ({ page }) => {
  await page.goto(
    `http://localhost:3000/?year=${date.getFullYear()}&month=${monthNumberToName(date.getMonth() + 1)}`,
  );

  const spendingTable = page.locator("#spending-table");
  const rows = spendingTable.locator("tbody tr");
  await expect(rows, {
    message: "2 spending items are returned. There should be 2 rows",
  }).toHaveCount(2);

  await expect(rows.nth(0), {
    message:
      "The row is expected to match the data returned by the mock server",
  }).toHaveText(
    `$100${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}Test descriptionTest notes`,
    { ignoreCase: true },
  );
  await expect(rows.nth(1)).toContainText(`$100${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}Test description 2Test notes 2`)
});
