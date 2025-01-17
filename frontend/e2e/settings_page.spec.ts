import test, { expect, Page } from "@playwright/test";

function monthBudgetLocator(page: Page) {
  return page.locator("#month-budget");
}

function shawnContributionPercentageLocator(page: Page) {
  return page.locator("#shawn-contribution-percentage");
}

function maggieContributionPercentageLocator(page: Page) {
  return page.locator("#maggie-contribution-percentage");
}

function shawnContributionAmountLocator(page: Page) {
  return page.locator("#shawn-contribution-amount");
}

function maggieContributionAmountLocator(page: Page) {
  return page.locator("#maggie-contribution-amount");
}

test("Settings page displays total budget and percentage split", async ({
  page,
}) => {
  await page.goto("http://localhost:3000/settings");
  const monthlyBudgetField = monthBudgetLocator(page);
  await expect(monthlyBudgetField).toHaveValue("300");

  const shawnContributionPercentage = shawnContributionPercentageLocator(page);
  await expect(shawnContributionPercentage).toHaveValue("60");

  const maggieContributionPercentage =
    maggieContributionPercentageLocator(page);
  await expect(maggieContributionPercentage).toHaveValue("40");

  const shawnContributionAmount = shawnContributionAmountLocator(page);
  page.locator("#shawn-contribution-amount");
  await expect(shawnContributionAmount).toHaveValue("180");

  const maggieContributionAmount = maggieContributionAmountLocator(page);
  await expect(maggieContributionAmount).toHaveValue("120");
});

test("Settings page fields updates dymnically", async ({ page }) => {
  await page.goto("http://localhost:3000/settings");
  // Set split percentage to 50/50
  await page.fill("input#shawn-contribution-percentage", "50");
  await page.fill("input#maggie-contribution-percentage", "50");

  // Set both contribution amount to 100
  await page.fill("input#maggie-contribution-amount", "100");
  await page.fill("input#shawn-contribution-amount", "100");

  // The total budget should be $200
  await expect(monthBudgetLocator(page), {
    message: "Incorrect monthly total",
  }).toHaveValue("200");

  await page.fill("input#shawn-contribution-percentage", "60");
  // 60% of the total budget - $200 should be 120
  await expect(shawnContributionAmountLocator(page)).toHaveValue("120");

  // The total budget should remain $200
  await expect(monthBudgetLocator(page), {
    message: "Incorrect monthly total",
  }).toHaveValue("200");
});
