import test, { expect, Page } from "@playwright/test";

/**
 * Locate the total allocation amount for the month
 */
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

  // Set shawn contribution amount to $100
  await page.fill("input#shawn-contribution-amount", "100");
  // Maggie contribution amount should be $100, since we are splitting 50/50
  await expect(maggieContributionAmountLocator(page), {
    message: "Incorrect maggie contribution amount",
  }).toHaveValue("100");

  // The total budget should be $200, since each person is contributing $100
  await expect(monthBudgetLocator(page), {
    message: "Incorrect monthly total",
  }).toHaveValue("200");

  // Change maggie contributing percentage to 40%
  await page.fill("input#maggie-contribution-percentage", "40");
  // Shawn's contributing percentage should update to 60%
  await expect(shawnContributionPercentageLocator(page), {
    message: "Incorrect contribution percentage",
  }).toHaveValue("60");

  await expect(shawnContributionAmountLocator(page), {
    message: "Incorrect Shawn contributing amount",
  }).toHaveValue("120");

  await expect(maggieContributionAmountLocator(page), {
    message: "Incorrect Maggie contributing amount",
  }).toHaveValue("80");

  await expect(monthBudgetLocator(page), {
    message: "Incorrect total month budget",
  }).toHaveValue("200");
});
