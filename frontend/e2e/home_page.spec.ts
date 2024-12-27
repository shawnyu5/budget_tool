import test, { expect } from "@playwright/test";
import { monthNumberToName } from "~/utils";

const date = new Date();
test("Displays correct total budget", async ({ page }) => {
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
  expect(selectedYear).toBe(date.getFullYear().toString());

  const monthDropdown = page.locator("#month-dropdown");
  const selectedMonth: string = await monthDropdown.evaluate(
    // @ts-ignore
    (select) => select.value,
  );
  expect(selectedMonth, { message: "Expect month to be the current month"}).toBe(monthNumberToName(date.getMonth() + 1));
});

