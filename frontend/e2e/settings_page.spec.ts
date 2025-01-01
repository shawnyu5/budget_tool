import test, { expect } from "@playwright/test";

test("Settings page displays total budget and percentage split", async ({
  page,
}) => {
  await page.goto("http://localhost:3000/settings");
  const monthlyBudgetInput = page.locator("#month-budget");
  await expect(monthlyBudgetInput).toHaveValue("300");

  const shawnContribution = page.locator("#shawn-contribution");
  await expect(shawnContribution).toHaveValue("60");

  const maggieContribution = page.locator("#maggie-contribution");
  await expect(maggieContribution).toHaveValue("40");
});
