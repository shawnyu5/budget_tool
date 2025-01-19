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

test("Settings page fields updates dynamically", async ({ page }) => {
  await page.goto("http://localhost:3000/settings");
  // Set split percentage to 50/50
  await page.fill("input#shawn-contribution-percentage", "50");
  await page.fill("input#maggie-contribution-percentage", "50");

  // Set both contribution amount to 100
  await page.fill("input#shawn-contribution-amount", "100");
  // TODO: since we calculate the maggie contribution based on shawn's contribution amount and maggie's contribution percentage, this value is auto adjusted to 50, due to maggie's contribution amount being 50% of Shawn's
  // await page.fill("input#maggie-contribution-amount", "100");

  // The total budget should be $150
  await expect(monthBudgetLocator(page), {
    message: "Incorrect monthly total",
  }).toHaveValue("150");

  await page.fill("input#maggie-contribution-amount", "100");
  await expect(shawnContributionAmountLocator(page), {
    message: "Incorrect contribution amount",
  }).toHaveValue("200");

  await page.fill("input#maggie-contribution-percentage", "40");
  await expect(shawnContributionPercentageLocator(page), {
    message: "Should have auto updated to 60",
  }).toHaveValue("60");

  await expect(monthBudgetLocator(page), {
    message: "The monthly total should not have changed",
  }).toHaveValue("300");
});
